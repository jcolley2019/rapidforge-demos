import type { DesignBrief } from './design-brief'

/**
 * Headline/subhead templates in a contractor's voice. Each vertical family
 * carries four templates tagged with the tones they suit; `pickCopy` scores
 * them against the brief's tone_descriptors and breaks ties with a stable
 * hash, so the same brief always yields the same copy.
 *
 * House rules: a headline is eight words or fewer, leads with the service or
 * the promise, and carries no italics and no dashes. A subhead names the
 * city, a response promise, and one trust fact. Nothing here invents a
 * year, a license number, or a price.
 */

export type CopyFamily = 'plumbing' | 'hvac' | 'electrical' | 'generic'

export interface CopyContext {
  name: string
  shortName: string
  city: string | null
  verticalLabel: string
}

export interface CopyTemplate {
  /** Lower-case tone words this template suits. */
  tones: string[]
  headline: (c: CopyContext) => string
  subhead: (c: CopyContext) => string
}

/** "Nampa" or "your area". */
const area = (c: CopyContext) => c.city ?? 'your area'
/** "across Nampa" or "in your area". */
const across = (c: CopyContext) => (c.city ? `across ${c.city}` : 'in your area')
/** "in Nampa" or "near you". */
const near = (c: CopyContext) => (c.city ? `in ${c.city}` : 'near you')
const trade = (c: CopyContext) => c.verticalLabel.toLowerCase()

const FAMILIES: Record<CopyFamily, CopyTemplate[]> = {
  plumbing: [
    {
      tones: ['dependable', 'reliable', 'trusted', 'honest', 'local'],
      headline: (c) => (c.city ? `${c.city} plumbers who show up on time.` : 'Plumbers who show up on time.'),
      subhead: (c) =>
        `Same-day service ${across(c)}. Licensed, insured, and upfront pricing from ${c.shortName}.`,
    },
    {
      tones: ['fast', 'emergency', 'responsive', 'quick', '24/7'],
      headline: () => `Water heater out? We're on the way.`,
      subhead: (c) => `Fast plumbing repair ${across(c)}, usually the same day. Licensed and insured.`,
    },
    {
      tones: ['straight-talking', 'no-nonsense', 'upfront', 'transparent', 'fair'],
      headline: () => `Honest plumbing. Upfront prices. No surprises.`,
      subhead: (c) =>
        `${c.shortName} serves ${area(c)} with same-day appointments and a price you approve before work starts.`,
    },
    {
      tones: ['family', 'friendly', 'neighborly', 'warm', 'caring'],
      headline: (c) => `Your local plumber ${near(c)}.`,
      subhead: (c) =>
        `Friendly, licensed plumbers serving ${area(c)}, with same-day service when you need it.`,
    },
  ],
  hvac: [
    {
      tones: ['dependable', 'reliable', 'trusted', 'local'],
      headline: (c) => `Reliable heating and cooling ${near(c)}.`,
      subhead: (c) =>
        `Repairs, replacements, and tune-ups ${across(c)}. Same-day service, licensed and insured.`,
    },
    {
      tones: ['fast', 'emergency', 'responsive', 'quick', '24/7'],
      headline: () => `No heat? No AC? We're on the way.`,
      subhead: (c) =>
        `Same-day heating and cooling repair ${across(c)}. Licensed, insured, upfront pricing.`,
    },
    {
      tones: ['efficient', 'modern', 'smart', 'clean', 'professional'],
      headline: () => `Efficient systems installed right the first time.`,
      subhead: (c) =>
        `${c.shortName} installs and services high-efficiency HVAC ${across(c)}. Upfront quotes and same-day service.`,
    },
    {
      tones: ['straight-talking', 'upfront', 'honest', 'fair', 'family', 'friendly'],
      headline: () => `Comfort you can count on, every season.`,
      subhead: (c) =>
        `Honest HVAC service ${across(c)}. Same-day appointments, licensed technicians, no surprise fees.`,
    },
  ],
  electrical: [
    {
      tones: ['safe', 'licensed', 'dependable', 'reliable', 'trusted', 'careful'],
      headline: (c) => `Safe, licensed electrical work ${near(c)}.`,
      subhead: (c) =>
        `Panels, wiring, and lighting done to code ${across(c)}. Same-day service, licensed and insured.`,
    },
    {
      tones: ['fast', 'emergency', 'responsive', 'quick', '24/7'],
      headline: () => `Lost power? We're on the way.`,
      subhead: (c) => `Same-day electrical repair ${across(c)}. Licensed, insured, upfront pricing.`,
    },
    {
      tones: ['modern', 'smart', 'clean', 'precise', 'professional'],
      headline: () => `Clean, code-compliant electrical work.`,
      subhead: (c) =>
        `From EV chargers to full rewires, ${c.shortName} serves ${area(c)} with same-day scheduling and licensed crews.`,
    },
    {
      tones: ['straight-talking', 'upfront', 'honest', 'fair', 'local', 'small', 'family', 'friendly'],
      headline: (c) => `Your local electrician ${near(c)}.`,
      subhead: (c) =>
        `Honest quotes and tidy work ${across(c)}, with same-day scheduling. Licensed, insured, and no job too small.`,
    },
  ],
  generic: [
    {
      tones: ['dependable', 'reliable', 'trusted', 'local', 'honest'],
      headline: (c) => `${c.verticalLabel} ${area(c)} can count on.`,
      subhead: (c) =>
        `${c.shortName} serves ${area(c)} with same-day scheduling, licensed and insured crews, and upfront pricing.`,
    },
    {
      tones: ['fast', 'responsive', 'quick', 'emergency', '24/7'],
      headline: () => `Need it fixed today? Call us.`,
      subhead: (c) =>
        `Fast, professional ${trade(c)} ${across(c)}, usually the same day. Licensed, insured, upfront pricing.`,
    },
    {
      tones: ['professional', 'modern', 'clean', 'quality', 'premium', 'expert'],
      headline: (c) => `${c.verticalLabel} done right, on time.`,
      subhead: (c) =>
        `${c.shortName} brings licensed, experienced crews to every job ${across(c)}, with same-day appointments available.`,
    },
    {
      tones: ['family', 'friendly', 'neighborly', 'warm', 'caring', 'upfront', 'fair'],
      headline: (c) => `Your neighborhood ${trade(c)} pros ${near(c)}.`,
      subhead: (c) =>
        `Friendly, licensed service ${across(c)}. Same-day appointments and a price you approve first.`,
    },
  ],
}

/** The action headline on the quote band, e.g. "Need a plumber today?". */
const CTA_HEADLINES: Record<CopyFamily, (c: CopyContext) => string> = {
  plumbing: () => 'Need a plumber today?',
  hvac: () => 'Need heating or cooling help today?',
  electrical: () => 'Need an electrician today?',
  generic: (c) => `Need ${trade(c)} help today?`,
}

const FAMILY_BY_VERTICAL: Record<string, CopyFamily> = {
  plumber: 'plumbing',
  plumbing: 'plumbing',
  plumbing_contractor: 'plumbing',
  hvac: 'hvac',
  hvac_contractor: 'hvac',
  heating_and_cooling: 'hvac',
  electrician: 'electrical',
  electrical: 'electrical',
  electrical_contractor: 'electrical',
}

export function copyFamilyFor(vertical: string): CopyFamily {
  return FAMILY_BY_VERTICAL[vertical] ?? 'generic'
}

/** Every template for a family, exposed so tests can check the house rules. */
export function templatesFor(family: CopyFamily): CopyTemplate[] {
  return FAMILIES[family]
}

export function ctaHeadlineFor(family: CopyFamily, ctx: CopyContext): string {
  return CTA_HEADLINES[family](ctx)
}

/** FNV-1a 32-bit: small, stable, dependency-free. */
export function stableHash(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

export function pickCopy(
  brief: Pick<DesignBrief, 'vertical' | 'tone_descriptors'>,
  ctx: CopyContext,
): { headline: string; subhead: string } {
  const templates = FAMILIES[copyFamilyFor(brief.vertical)]
  const tones = brief.tone_descriptors.map((t) => t.trim().toLowerCase())

  let best: CopyTemplate[] = []
  let bestScore = -1
  for (const t of templates) {
    const score = t.tones.filter((tone) => tones.includes(tone)).length
    if (score > bestScore) {
      bestScore = score
      best = [t]
    } else if (score === bestScore) {
      best.push(t)
    }
  }

  const key = [...tones].sort().join('|')
  const chosen = best[stableHash(key) % best.length]
  return { headline: chosen.headline(ctx), subhead: chosen.subhead(ctx) }
}
