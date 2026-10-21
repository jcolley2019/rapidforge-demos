import type { Ref } from 'react'
import { useSite } from '../../brief/site-context'
import { heroActions } from '../../brief/site-helpers'
import BadgeRow from '../../components/BadgeRow'
import FullBleedPhoto from '../../components/FullBleedPhoto'
import { presetForVariant } from '../../presets/presets'
import { fullBleedPhotoFor } from '../heroPhoto'

/**
 * Full-bleed, kept calm: one photo fills the first screen under a heavy
 * dark shade and a soft vignette; a gold hairline, the serif headline and
 * the actions sit centered; the credentials run along the bottom edge on a
 * translucent strip. The page's OverlayHeader floats over its top and
 * watches it through `ref`.
 */
export default function ClHero({ ref }: { ref?: Ref<HTMLElement> }) {
  const site = useSite()
  const palette = presetForVariant('cleanpro', site.vertical).palette
  const photo = fullBleedPhotoFor('cleanpro', site)
  const { primary, secondary } = heroActions(site)
  return (
    <section ref={ref} className="cl-hero" aria-label="Introduction" data-full-bleed="">
      <div className="cl-hero-media" aria-hidden="true">
        <FullBleedPhoto src={photo} palette={palette} className="cl-hero-img" />
      </div>
      <div className="cl-wrap cl-hero-inner">
        <div className="cl-hero-copy">
          <span className="cl-hero-rule" aria-hidden="true" />
          <h1 className="cl-display cl-hero-h1">{site.headline}</h1>
          <p className="cl-hero-sub">{site.subhead}</p>
          <div className="cl-hero-actions">
            <a href={primary.href} className={`cl-btn cl-btn-gold cl-hero-btn ${primary.call ? 'cl-num' : ''}`.trim()}>
              {primary.label}
            </a>
            {secondary && (
              <a href={secondary.href} className={`cl-btn cl-btn-outline cl-hero-btn ${secondary.call ? 'cl-num' : ''}`.trim()}>
                {secondary.label}
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="cl-hero-strip">
        <div className="cl-wrap">
          <BadgeRow site={site} />
        </div>
      </div>
    </section>
  )
}
