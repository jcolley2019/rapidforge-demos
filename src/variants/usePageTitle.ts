import { useEffect } from 'react'
import { useSite } from '../brief/site-context'
import { variants } from './variants'

/** Sets document.title to "<business> — <variant>" while a variant page is mounted. */
export function usePageTitle(slug: string) {
  const { name } = useSite()
  useEffect(() => {
    const label = variants.find((v) => v.slug === slug)?.name ?? slug
    document.title = `${name} — ${label}`
  }, [slug, name])
}
