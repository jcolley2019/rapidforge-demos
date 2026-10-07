import '@fontsource-variable/montserrat'
import '@fontsource-variable/open-sans'
import '@fontsource-variable/cormorant/wght-italic.css'
import './heritage.css'

import AudienceStrip from '../../components/AudienceStrip'
import BackToConceptsLink from '../../components/BackToConceptsLink'
import BadgeRow from '../../components/BadgeRow'
import Offers from '../../components/Offers'
import ServiceAreas from '../../components/ServiceAreas'
import UtilityBar from '../../components/UtilityBar'
import { useSite } from '../../brief/site-context'
import { usePageTitle } from '../usePageTitle'
import VariantSite from '../VariantSite'
import PpNav from './PpNav'
import PpHero from './PpHero'
import PpServices from './PpServices'
import PpReviews from './PpReviews'
import PpHours from './PpHours'
import PpQuoteCta from './PpQuoteCta'
import PpFooter from './PpFooter'

/** Clean Trust: preset `clean-trust` (vault family F4 Mountain Blue Heritage). */
export default function HeritagePage() {
  usePageTitle('heritage')
  return (
    <VariantSite slug="heritage">
      <HeritageBody />
    </VariantSite>
  )
}

function HeritageBody() {
  const site = useSite()
  return (
    <div className="heritage" id="top">
      <BackToConceptsLink />
      <UtilityBar site={site} wrapClassName="pp-wrap" />
      <PpNav />
      <main>
        <PpHero />
        <Offers site={site} className="pp-offers" wrapClassName="pp-wrap" />
        <div className="pp-band">
          <div className="pp-wrap">
            <BadgeRow site={site} />
          </div>
        </div>
        <PpServices />
        <ServiceAreas site={site} className="pp-section pp-areas" wrapClassName="pp-wrap" titleClassName="pp-display pp-h2" />
        <AudienceStrip site={site} className="pp-section pp-who" wrapClassName="pp-wrap" titleClassName="pp-display pp-h2" />
        <PpReviews />
        <PpHours />
        <PpQuoteCta />
      </main>
      <PpFooter />
    </div>
  )
}
