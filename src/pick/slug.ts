/** The lead slug a brief name stands for: `lead-goodson` → `goodson`; a fixture stem is its own slug. */
export function pickSlugOf(briefName: string): string {
  return briefName.startsWith('lead-') ? briefName.slice('lead-'.length) : briefName
}
