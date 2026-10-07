import { useSite } from '../brief/site-context'

/**
 * The header wordmark: the brief's logo when it has one, else the short
 * name as text. `plate` sets the logo on a light chip, for navs whose
 * ground is dark, since most contractor logos are drawn for a white header.
 */
export default function BrandMark({ plate = false }: { plate?: boolean }) {
  const site = useSite()
  if (!site.logoUrl) return <>{site.shortName}</>
  return (
    <img
      src={site.logoUrl}
      alt={site.name}
      className={plate ? 'brand-logo brand-logo-plate' : 'brand-logo'}
      decoding="async"
    />
  )
}
