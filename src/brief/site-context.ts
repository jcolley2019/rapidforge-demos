import { createContext, useContext } from 'react'
import { useSearchParams } from 'react-router-dom'
import { resolveBriefName, siteContent } from './current'
import type { SiteContent } from './site-content'

/**
 * The site a page renders. App provides the brief chosen by `?brief=`;
 * each variant page provides it again with its preset's lean applied, so
 * everything under a variant reads the copy that variant should show.
 */
export const SiteContext = createContext<SiteContent>(siteContent)

export function useSite(): SiteContent {
  return useContext(SiteContext)
}

/** The fixture stem in use: `?brief=` when it names a fixture, else the build default. */
export function useBriefName(): string {
  const [params] = useSearchParams()
  return resolveBriefName(params.get('brief'))
}
