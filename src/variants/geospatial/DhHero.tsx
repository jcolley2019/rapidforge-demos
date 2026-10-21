import type { Ref } from 'react'
import { useSite } from '../../brief/site-context'
import { heroActions } from '../../brief/site-helpers'
import BadgeRow from '../../components/BadgeRow'
import FullBleedPhoto from '../../components/FullBleedPhoto'
import { presetForVariant } from '../../presets/presets'
import { fullBleedPhotoFor } from '../heroPhoto'

/**
 * Full-bleed: one photo fills the first screen under a dark-to-clear grade,
 * a condensed white headline and both actions sit bottom-left, and the
 * trust row runs along the bottom edge on a translucent strip. The page's
 * OverlayHeader floats over its top and watches it through `ref`.
 */
export default function DhHero({ ref }: { ref?: Ref<HTMLElement> }) {
  const site = useSite()
  const palette = presetForVariant('geospatial', site.vertical).palette
  const photo = fullBleedPhotoFor('geospatial', site)
  const { primary, secondary } = heroActions(site)
  return (
    <section ref={ref} className="dh-hero" aria-label="Introduction" data-full-bleed="">
      <div className="dh-hero-media" aria-hidden="true">
        <FullBleedPhoto src={photo} palette={palette} className="dh-hero-img" />
      </div>
      <div className="dh-wrap dh-hero-inner">
        <div className="dh-hero-copy">
          <h1 className="dh-hero-h1">{site.headline}</h1>
          <p className="dh-hero-sub">{site.subhead}</p>
          <div className="dh-hero-actions">
            <a href={primary.href} className={`dh-btn dh-btn-red dh-hero-btn ${primary.call ? 'dh-num' : ''}`.trim()}>
              {primary.label}
            </a>
            {secondary && (
              <a href={secondary.href} className={`dh-btn dh-btn-ghost dh-hero-btn ${secondary.call ? 'dh-num' : ''}`.trim()}>
                {secondary.label}
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="dh-hero-strip">
        <div className="dh-wrap">
          <BadgeRow site={site} className="dh-trustbar" />
        </div>
      </div>
    </section>
  )
}
