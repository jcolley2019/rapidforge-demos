/** See src/deploy/lead-brief-plugin.ts: the one lead brief this build carries, or null. */
declare module 'virtual:lead-brief' {
  const brief: unknown
  export default brief
  export const stem: string | null
  /** Pixel size of each of the lead's intake photos, keyed by its URL in the brief; empty without a lead. */
  export const photoSizes: Record<string, { width: number; height: number }>
}
