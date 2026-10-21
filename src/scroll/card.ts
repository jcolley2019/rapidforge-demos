/**
 * RFD.SCROLL.14a: a scroll build's own picker card. A build may carry a
 * card.json next to its index.html, { "description": "...", "swatches":
 * ["#rrggbb", x4] }. The deploy checks it, ships it at /scroll/card.json and
 * builds the picker with it as VITE_SCROLL_CARD (src/deploy/scroll.ts); the
 * Scroll Story card then shows it instead of its defaults (src/scroll/look.ts).
 */

export const CARD_DESCRIPTION_MAX = 140

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

export interface ScrollCard {
  /** The card's one line, at most CARD_DESCRIPTION_MAX characters. */
  description: string
  /** Four hex colours, in the order the card shows them. */
  swatches: string[]
}

/** The card in `value` with nothing else on it; throws, naming what is wrong. */
export function parseScrollCard(value: unknown): ScrollCard {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('card.json must be an object with "description" and "swatches"')
  }
  const { description, swatches } = value as { description?: unknown; swatches?: unknown }
  if (typeof description !== 'string' || !description.trim()) throw new Error('card.json "description" must be a non-empty string')
  const line = description.trim()
  if (line.length > CARD_DESCRIPTION_MAX) {
    throw new Error(`card.json "description" is ${line.length} characters; the most is ${CARD_DESCRIPTION_MAX}`)
  }
  if (!Array.isArray(swatches) || swatches.length !== 4) throw new Error('card.json "swatches" must be 4 hex colours')
  const bad = swatches.filter((color) => typeof color !== 'string' || !HEX.test(color))
  if (bad.length > 0) {
    throw new Error(`card.json "swatches" must be hex colours like #0b1f3a, not ${bad.map((color) => JSON.stringify(color)).join(', ')}`)
  }
  return { description: line, swatches: swatches as string[] }
}
