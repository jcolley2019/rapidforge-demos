import { z } from 'zod/v4'
import type { DesignBrief } from '../brief/design-brief'
import { verticalLabelOf } from '../brief/site-content'
import { TEXT_MODEL, describeError, formatFor, parseStructured, type AiClient } from './ai'
import { DAYS, type HoursRow, type SiteSignals } from './extract'

/**
 * Step 5: one Sonnet call over the extracted text and candidates for the
 * judgement calls: a clean service list, tone, segment with its reason,
 * the current site's problem (only when no lead brief supplied one), and
 * hours normalized from free text. Each field is validated on its own; a
 * field that fails, or every field when the call fails, falls back to the
 * deterministic value and the fallback is logged.
 */

export type Segment = DesignBrief['segment']
const SEGMENTS = ['residential', 'commercial', 'new_construction', 'mixed'] as const

export interface RefineInput {
  businessName: string | null
  vertical: string
  websiteUrl: string
  serviceCandidates: string[]
  hoursText: string | null
  /** Visible site text, homepage first. */
  text: string
  signals: SiteSignals
  /** False when the lead brief already has a current_site_problem. */
  needsProblem: boolean
}

export interface Refined {
  services: string[]
  tone_descriptors: string[]
  segment: Segment
  segment_reason: string
  current_site_problem: string | null
  hours: HoursRow[] | null
}

export interface RefineResult extends Refined {
  /** Fields that fell back to the deterministic value, with why. */
  fallbacks: Array<{ field: keyof Refined; reason: string }>
  /** The model that answered, or null when the call failed. */
  model: string | null
}

const RefineWire = z.object({
  services: z.array(z.string()),
  tone_descriptors: z.array(z.string()),
  segment: z.enum(SEGMENTS),
  segment_reason: z.string(),
  current_site_problem: z.string().nullable(),
  hours: z.array(z.object({ day: z.string(), open: z.string().nullable(), close: z.string().nullable() })).nullable(),
})

const TIME = /^(?:1[0-2]|[1-9]):[0-5]\d (?:AM|PM)$/
const label = (s: string) => s.replace(/\s+/g, ' ').trim()

/** The checks the wire schema cannot carry (the Messages API rejects min/max), per field. */
const FIELD_CHECKS: { [K in keyof Refined]: z.ZodType<Refined[K]> } = {
  services: z.array(z.string().transform(label).pipe(z.string().min(2).max(60))).min(1).max(12),
  tone_descriptors: z.array(z.string().transform(label).pipe(z.string().min(2).max(30))).min(3).max(5),
  segment: z.enum(SEGMENTS),
  segment_reason: z.string().transform(label).pipe(z.string().min(5).max(300)),
  current_site_problem: z.string().transform(label).pipe(z.string().min(20).max(320)).nullable(),
  hours: z
    .array(
      z.object({
        day: z.string(),
        open: z.string().regex(TIME).nullable(),
        close: z.string().regex(TIME).nullable(),
      }),
    )
    .length(7)
    .refine((rows) => rows.every((r, i) => r.day === DAYS[i]), 'hours must run Monday to Sunday')
    .nullable(),
}

// Deterministic fallbacks ------------------------------------------------

const SERVICE_WORDS =
  /drain|sewer|water heater|tankless|leak|pipe|repip|toilet|faucet|fixture|disposal|gas line|softener|filtration|backflow|sump|slab|jetting|camera|bathroom|kitchen|remodel|hvac|furnace|heat pump|air condition|\bac\b|duct|thermostat|boiler|electrical|panel|wiring|outlet|lighting|generator|ev charg|surge|inspection|repair|install|replace|maintenance|emergency/i

/** Candidates that name a trade service, up to 12; else the vertical itself. */
export function fallbackServices(candidates: string[], vertical: string): string[] {
  const services = candidates.filter((c) => SERVICE_WORDS.test(c)).slice(0, 12)
  return services.length > 0 ? services : [verticalLabelOf(vertical)]
}

export const FALLBACK_TONE = ['dependable', 'local', 'professional']

const count = (text: string, words: RegExp) => text.match(words)?.length ?? 0

/** Segment from word counts: new construction, commercial, residential, or mixed when both of the last two are strong. */
export function guessSegment(text: string): { segment: Segment; reason: string } {
  const residential = count(text, /\bresidential\b|\bhomeowners?\b|\byour home\b|\bfamil(?:y|ies)\b/gi)
  const commercial = count(text, /\bcommercial\b|tenant improvement|property manag|\brestaurants?\b|\bfacilit(?:y|ies)\b|\bindustrial\b/gi)
  const building = count(text, /new construction|\bbuilders?\b|rough-in|custom homes?/gi)
  const tally = `${residential} residential, ${commercial} commercial, ${building} new-construction mentions`
  if (building > Math.max(residential, commercial)) return { segment: 'new_construction', reason: `Word count: ${tally}.` }
  if (residential > 0 && commercial > 0 && Math.min(residential, commercial) / Math.max(residential, commercial) >= 0.5) {
    return { segment: 'mixed', reason: `Word count: ${tally}.` }
  }
  if (commercial > residential) return { segment: 'commercial', reason: `Word count: ${tally}.` }
  return { segment: 'residential', reason: `Word count: ${tally}.` }
}

function listOf(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/** A plain statement of what the signals show is missing. */
export function fallbackProblem(signals: SiteSignals): string {
  const gaps: string[] = []
  if (!signals.hasViewport) gaps.push('does not resize for phones')
  if (!signals.hasTelLink) gaps.push('has no tap-to-call phone link')
  if (!signals.hasHours) gaps.push('does not list business hours')
  if (!signals.hasBooking) gaps.push('offers no online booking')
  if (!signals.isHttps) gaps.push('is not served over HTTPS')
  if (gaps.length === 0) return 'Current site covers the basics but does little to set the business apart from other local contractors.'
  return `Current site ${listOf(gaps.slice(0, 3))}.`
}

export function deterministicRefine(input: RefineInput): Refined {
  const segment = guessSegment(input.text)
  return {
    services: fallbackServices(input.serviceCandidates, input.vertical),
    tone_descriptors: [...FALLBACK_TONE],
    segment: segment.segment,
    segment_reason: segment.reason,
    current_site_problem: input.needsProblem ? fallbackProblem(input.signals) : null,
    hours: null,
  }
}

// The call ---------------------------------------------------------------

const REFINE_SYSTEM = `You clean up data scraped from a local contractor's website so it can fill a design brief for a redesign demo. Use only what the site supports; never invent services, hours or facts.
Return:
- services: up to 12 services the business really offers, short title-case names of 2 to 5 words, most important first, drawn from the candidates and the page text. Drop navigation labels, town names, slogans and duplicates.
- tone_descriptors: 3 to 5 single adjectives for how the business presents itself.
- segment: residential, commercial, new_construction or mixed (both residential and commercial in earnest); segment_reason: one sentence citing the evidence.
- current_site_problem: when asked for, one or two plain sentences, under 200 characters in all, naming the biggest problems a customer meets on this site today, judged from the signals and the text; otherwise null. The signals and text come from the static HTML, where widgets loaded by script (reviews, ratings, booking, chat) do not appear, so never claim something is missing unless the text itself shows it.
- hours: when the hours text gives weekly hours, seven rows Monday to Sunday, open and close as "h:mm AM" / "h:mm PM", both null on a closed day; otherwise null.`

function refinePrompt(input: RefineInput): string {
  return [
    `Business: ${input.businessName ?? '(unknown)'}`,
    `Website: ${input.websiteUrl}`,
    `Trade: ${verticalLabelOf(input.vertical)}`,
    `Site signals: ${JSON.stringify(input.signals)}`,
    `current_site_problem: ${input.needsProblem ? 'write it' : 'not needed, return null'}`,
    '',
    'Service candidates (nav labels and headings):',
    input.serviceCandidates.map((c) => `- ${c}`).join('\n') || '(none)',
    '',
    'Hours text:',
    input.hoursText ?? '(none found)',
    '',
    'Page text:',
    input.text,
  ].join('\n')
}

export async function refineWithAi(
  client: AiClient,
  input: RefineInput,
  log: (message: string) => void = () => {},
): Promise<RefineResult> {
  const fallback = deterministicRefine(input)
  let wire: z.infer<typeof RefineWire>
  let model: string
  try {
    const res = await client.complete({
      provider: 'anthropic',
      model: TEXT_MODEL,
      maxTokens: 6000,
      timeoutMs: 120_000,
      messages: [
        { role: 'system', content: REFINE_SYSTEM },
        { role: 'user', content: refinePrompt(input) },
      ],
      outputConfig: { effort: 'low', format: formatFor(RefineWire, 'refine') },
    })
    wire = parseStructured(res, RefineWire)
    model = res.model
  } catch (error) {
    const reason = describeError(error)
    log(`refine: call failed (${reason}); every field falls back to the deterministic value`)
    const fields = Object.keys(fallback) as Array<keyof Refined>
    return { ...fallback, fallbacks: fields.map((field) => ({ field, reason })), model: null }
  }

  const result = { ...fallback } as Refined
  const fallbacks: RefineResult['fallbacks'] = []
  for (const field of Object.keys(FIELD_CHECKS) as Array<keyof Refined>) {
    if (field === 'current_site_problem' && !input.needsProblem) continue
    const checked = FIELD_CHECKS[field].safeParse(wire[field])
    if (checked.success) {
      ;(result as Record<keyof Refined, unknown>)[field] = checked.data
    } else {
      const reason = checked.error.issues.map((i) => `${i.path.join('.') || field}: ${i.message}`).join('; ')
      fallbacks.push({ field, reason })
      log(`refine: ${field} failed validation (${reason}); using the deterministic value`)
    }
  }
  // A segment and its reason travel together.
  if (fallbacks.some((f) => f.field === 'segment' || f.field === 'segment_reason')) {
    result.segment = fallback.segment
    result.segment_reason = fallback.segment_reason
  }
  return { ...result, fallbacks, model }
}
