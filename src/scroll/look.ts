import { swatchesOf, type Preset } from '../presets/presets'
import { parseScrollCard, type ScrollCard } from './card'

/**
 * The Scroll Story look: a scroll-craft page shipped at /scroll by the
 * deploy when the lead has a build (src/deploy/scroll.ts). It is static,
 * not a variant route, so it is not in src/variants/variants.ts; the picker
 * shows its card only in a build made with VITE_SCROLL=1, and its pick
 * posts variant "scroll" with this preset id.
 */

export const SCROLL_SLUG = 'scroll'

/** The engine's own tokens (scrollcraft.css), so the pick button and modal wear the page's look. */
export const SCROLL_LOOK: Preset = {
  id: 'scroll-story',
  name: 'Scroll Story',
  description: 'A cinematic page that moves as you scroll: your photos, your story, one screen at a time.',
  lean: 'residential',
  collection: 'scroll-craft',
  entryId: 'scroll-story',
  brief: '',
  palette: { bg: '#08090b', surface: '#101217', text: '#f4f2ef', muted: '#9a9ba1', accent: '#d8ff3e', accent2: '#e8a317' },
  type: { display: 'Instrument Sans', body: 'Geist', source: 'system' },
  heroTreatment: 'scroll-driven',
  neverList: [],
}

/** True in a build made with VITE_SCROLL=1 (a deploy that found the lead's scroll build). */
export function scrollEnabled(env: Record<string, string | boolean | undefined> = import.meta.env): boolean {
  return env.VITE_SCROLL === '1'
}

/**
 * What the Scroll Story card shows: the build's own blurb and swatches when
 * the deploy passed its card.json in as VITE_SCROLL_CARD (src/scroll/card.ts),
 * else SCROLL_LOOK's. One that does not parse falls back too.
 */
export function scrollCard(env: Record<string, string | boolean | undefined> = import.meta.env): ScrollCard {
  const raw = env.VITE_SCROLL_CARD
  if (typeof raw === 'string' && raw.trim()) {
    try {
      return parseScrollCard(JSON.parse(raw))
    } catch {
      // The deploy refuses a malformed card.json, so only a hand-set value lands here.
    }
  }
  return { description: SCROLL_LOOK.description, swatches: swatchesOf(SCROLL_LOOK) }
}
