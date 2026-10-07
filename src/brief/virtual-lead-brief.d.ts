/** See src/deploy/lead-brief-plugin.ts: the one lead brief this build carries, or null. */
declare module 'virtual:lead-brief' {
  const brief: unknown
  export default brief
  export const stem: string | null
}
