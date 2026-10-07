import '@fontsource-variable/cormorant'
import '@fontsource-variable/cormorant/wght-italic.css'
import '@fontsource-variable/montserrat'
import './cleanpro.css'

import AudienceStrip from '../../components/AudienceStrip'
import BackToConceptsLink from '../../components/BackToConceptsLink'
import BadgeRow from '../../components/BadgeRow'
import Offers from '../../components/Offers'
import ServiceAreas from '../../components/ServiceAreas'
import UtilityBar from '../../components/UtilityBar'
import { useSite } from '../../brief/site-context'
import { usePageTitle } from '../usePageTitle'
import { variantTokens } from '../../presets/tokens'
import VariantSite from '../VariantSite'
import ClNav from './ClNav'
import ClHero from './ClHero'
import ClServices from './ClServices'
import ClReviews from './ClReviews'
import ClHours from './ClHours'
import ClQuoteCta from './ClQuoteCta'
import ClFooter from './ClFooter'

/**
 * Premium Dark: preset `premium-dark` (black ground, gold accent, Cormorant),
 * the one deliberate departure from the vault: no plumbing family is dark.
 */
export default function CleanProPage() {
  usePageTitle('cleanpro')
  return (
    <VariantSite slug="cleanpro">
      <CleanProBody />
    </VariantSite>
  )
}

function CleanProBody() {
  const site = useSite()
  return (
    <div className="cleanpro" id="top" style={variantTokens('cleanpro', site.vertical)}>
      <BackToConceptsLink />
      <UtilityBar site={site} wrapClassName="cl-wrap" />
      <ClNav />
      <main>
        <ClHero />
        <Offers site={site} className="cl-offers" wrapClassName="cl-wrap" />
        <div className="cl-wrap">
          <BadgeRow site={site} />
        </div>
        <ClServices />
        <ServiceAreas site={site} className="cl-section cl-areas" wrapClassName="cl-wrap" titleClassName="cl-display cl-h2" />
        <AudienceStrip site={site} className="cl-section cl-who" wrapClassName="cl-wrap" titleClassName="cl-display cl-h2" />
        <ClReviews />
        <ClHours />
        <ClQuoteCta />
      </main>
      <ClFooter />
    </div>
  )
}
