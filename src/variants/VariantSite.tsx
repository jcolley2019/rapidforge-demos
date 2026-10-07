import { useMemo, type ReactNode } from 'react'
import { SiteContext, useSite } from '../brief/site-context'
import { forLean } from '../brief/site-content'
import { presetForVariant } from '../presets/presets'

/**
 * Re-provides the current site with this variant's preset lean applied, so
 * every section under a variant page reads the copy and mode that variant
 * should show (see forLean).
 */
export default function VariantSite({ slug, children }: { slug: string; children: ReactNode }) {
  const site = useSite()
  const lean = presetForVariant(slug, site.vertical).lean
  const leaned = useMemo(() => forLean(site, lean), [site, lean])
  return <SiteContext.Provider value={leaned}>{children}</SiteContext.Provider>
}
