import type { DesignBrief } from './design-brief'

/**
 * Headline/subhead templates. Each vertical family carries 3–4 templates
 * tagged with the tones they suit; `pickCopy` scores templates against the
 * brief's tone_descriptors and resolves ties with a stable hash, so the
 * same brief always yields the same copy.
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

const place = (c: CopyContext) => (c.city ? `in ${c.city}` : 'near you')
const area = (c: CopyContext) => c.city ?? 'your area'

const FAMILIES: Record<CopyFamily, CopyTemplate[]> = {
  plumbing: [
    {
      tones: ['dependable', 'reliable', 'trusted', 'honest', 'local'],
      headline: (c) => `Plumbing ${area(c)} can count on.`,
      subhead: (c) =>
        `${c.shortName} shows up on time, fixes it right, and tells you the price before the work starts.`,
    },
    {
      tones: ['fast', 'emergency', 'responsive', 'quick', '24/7'],
      headline: () => `Leak, clog, or no hot water? We're on our way.`,
      subhead: (c) =>
        `Fast, straightforward plumbing repair ${place(c)} — from drains to water heaters.`,
    },
    {
      tones: ['straight-talking', 'no-nonsense', 'upfront', 'transparent', 'fair'],
      headline: () => `Straight answers. Solid plumbing.`,
      subhead: (c) =>
        `${c.shortName} handles repairs and installs ${place(c)} with upfront pricing and no upsell.`,
    },
    {
      tones: ['family', 'friendly', 'neighborly', 'warm', 'caring'],
      headline: (c) => `Your neighborhood plumber ${place(c)}.`,
      subhead: (c) =>
        `Friendly, licensed plumbers who treat your home like their own — ${c.shortName}.`,
    },
  ],
  hvac: [
    {
      tones: ['dependable', 'reliable', 'trusted', 'local'],
      headline: (c) => `Comfort ${area(c)} can rely on, every season.`,
      subhead: (c) =>
        `${c.shortName} keeps furnaces and air conditioners running right — repair, replacement, and tune-ups.`,
    },
    {
      tones: ['fast', 'emergency', 'responsive', 'quick'],
      headline: () => `No heat? No cool? We fix it today.`,
      subhead: (c) => `Same-day heating and cooling repair ${place(c)}.`,
    },
    {
      tones: ['efficient', 'modern', 'smart', 'clean', 'professional'],
      headline: () => `Efficient systems. Lower bills. Steady comfort.`,
      subhead: (c) =>
        `${c.shortName} installs and services high-efficiency heating and cooling ${place(c)}.`,
    },
  ],
  electrical: [
    {
      tones: ['safe', 'licensed', 'dependable', 'reliable', 'trusted', 'careful'],
      headline: (c) => `Licensed electrical work ${area(c)} trusts.`,
      subhead: (c) =>
        `${c.shortName} handles panels, wiring, and lighting to code — safely and on schedule.`,
    },
    {
      tones: ['fast', 'emergency', 'responsive', 'quick'],
      headline: () => `Power problems don't wait. Neither do we.`,
      subhead: (c) => `Prompt electrical repair and troubleshooting ${place(c)}.`,
    },
    {
      tones: ['modern', 'smart', 'clean', 'precise', 'professional'],
      headline: () => `Clean, precise electrical for modern homes.`,
      subhead: (c) =>
        `From EV chargers to full rewires, ${c.shortName} does it neatly and to code ${place(c)}.`,
    },
    {
      tones: ['straight-talking', 'upfront', 'honest', 'fair', 'local', 'small'],
      headline: (c) => `Your local electrician ${place(c)}.`,
      subhead: (c) =>
        `Honest quotes and tidy work from ${c.shortName} — no job too small.`,
    },
  ],
  generic: [
    {
      tones: ['dependable', 'reliable', 'trusted', 'local', 'honest'],
      headline: (c) => `${c.verticalLabel} ${area(c)} can count on.`,
      subhead: (c) =>
        `${c.shortName} delivers reliable ${c.verticalLabel.toLowerCase()} with clear pricing and real follow-through.`,
    },
    {
      tones: ['fast', 'responsive', 'quick', 'emergency'],
      headline: () => `Need it done? Call us.`,
      subhead: (c) =>
        `Fast, professional ${c.verticalLabel.toLowerCase()} ${place(c)} from ${c.shortName}.`,
    },
    {
      tones: ['professional', 'modern', 'clean', 'quality', 'premium', 'expert'],
      headline: (c) => `${c.verticalLabel}, done properly.`,
      subhead: (c) =>
        `${c.shortName} brings experience and care to every job ${place(c)}.`,
    },
  ],
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

/** FNV-1a 32-bit — small, stable, dependency-free. */
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
