import { useEffect } from 'react'
import { siteContent } from '../brief/current'
import { variants } from './variants'

/** Sets document.title to "<business> — <variant>" while a variant page is mounted. */
export function usePageTitle(slug: string) {
  useEffect(() => {
    const label = variants.find((v) => v.slug === slug)?.name ?? slug
    document.title = `${siteContent.name} — ${label}`
  }, [slug])
}
