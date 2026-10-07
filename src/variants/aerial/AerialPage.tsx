import '@fontsource-variable/rubik'
import '@fontsource-variable/manrope'
import './aerial.css'

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
import WsNav from './WsNav'
import WsHero from './WsHero'
import WsServices from './WsServices'
import WsReviews from './WsReviews'
import WsHours from './WsHours'
import WsQuoteCta from './WsQuoteCta'
import WsFooter from './WsFooter'

/**
 * Modern Minimal: preset `modern-minimal` (vault family F2 Jobsite Red
 * Commercial). The preset leans commercial: on a residential brief it keeps
 * the residential sections and speaks in the jobsite register.
 */
export default function AerialPage() {
  usePageTitle('aerial')
  return (
    <VariantSite slug="aerial">
      <AerialBody />
    </VariantSite>
  )
}

function AerialBody() {
  const site = useSite()
  return (
    <div className="aerial" id="top" style={variantTokens('aerial', site.vertical)}>
      <BackToConceptsLink />
      <UtilityBar site={site} wrapClassName="ws-wrap" />
      <WsNav />
      <main>
        <WsHero />
        <Offers site={site} className="ws-offers" wrapClassName="ws-wrap" />
        <div className="ws-wrap">
          <BadgeRow site={site} part="marks" className="ws-marks" />
        </div>
        <WsServices />
        <ServiceAreas site={site} className="ws-section ws-areas" wrapClassName="ws-wrap" titleClassName="ws-display ws-h2" />
        <AudienceStrip site={site} className="ws-section ws-who" wrapClassName="ws-wrap" titleClassName="ws-display ws-h2" />
        <WsReviews />
        <WsHours />
        <WsQuoteCta />
      </main>
      <WsFooter />
    </div>
  )
}
