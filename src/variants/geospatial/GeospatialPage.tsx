import '@fontsource-variable/dm-sans'
import './geospatial.css'

import AudienceStrip from '../../components/AudienceStrip'
import BackToConceptsLink from '../../components/BackToConceptsLink'
import Offers from '../../components/Offers'
import ServiceAreas from '../../components/ServiceAreas'
import UtilityBar from '../../components/UtilityBar'
import { useSite } from '../../brief/site-context'
import { usePageTitle } from '../usePageTitle'
import VariantSite from '../VariantSite'
import DhNav from './DhNav'
import DhHero from './DhHero'
import DhServices from './DhServices'
import DhReviews from './DhReviews'
import DhHours from './DhHours'
import DhQuoteCta from './DhQuoteCta'
import DhFooter from './DhFooter'

/** Bold Local: preset `bold-local` (vault family F1 Red Banner Plumbers). */
export default function GeospatialPage() {
  usePageTitle('geospatial')
  return (
    <VariantSite slug="geospatial">
      <GeospatialBody />
    </VariantSite>
  )
}

function GeospatialBody() {
  const site = useSite()
  return (
    <div className="geospatial" id="top">
      <BackToConceptsLink />
      <UtilityBar site={site} wrapClassName="dh-wrap" />
      <DhNav />
      <main>
        <DhHero />
        <Offers site={site} className="dh-specials" wrapClassName="dh-wrap" />
        <DhServices />
        <ServiceAreas site={site} className="dh-section dh-areas" wrapClassName="dh-wrap" titleClassName="dh-display dh-h2" />
        <AudienceStrip site={site} className="dh-section dh-who" wrapClassName="dh-wrap" titleClassName="dh-display dh-h2" />
        <DhReviews />
        <DhHours />
        <DhQuoteCta />
      </main>
      <DhFooter />
    </div>
  )
}
