import { useState } from 'react'
import { useBriefName, useSite } from '../brief/site-context'
import { pickSlugOf } from '../pick/slug'
import { presetForVariant } from '../presets/presets'
import { pickTokens } from './pickTokens'
import PickModal, { type PickTarget } from './PickModal'

/**
 * The floating "I like this one" on a variant page. Every variant page
 * mounts one through VariantSite; it reads the page's preset so the button
 * and the modal wear that look's palette.
 */
export default function LikeThisButton({ variantSlug }: { variantSlug: string }) {
  const site = useSite()
  const briefName = useBriefName()
  const [open, setOpen] = useState(false)
  const preset = presetForVariant(variantSlug, site.vertical)
  const target: PickTarget = { slug: pickSlugOf(briefName), businessName: site.name, businessId: site.leadBusinessId, preset, variantSlug }
  return (
    <>
      <button type="button" className="pick-fab" style={pickTokens(preset)} onClick={() => setOpen(true)}>
        <span className="pick-fab-heart" aria-hidden="true">
          ♥
        </span>
        I like this one
      </button>
      {open && <PickModal target={target} onClose={() => setOpen(false)} />}
    </>
  )
}
