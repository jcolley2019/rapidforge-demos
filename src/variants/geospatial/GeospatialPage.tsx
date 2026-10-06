import '@fontsource/barlow-condensed/700.css'
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow/700.css'
import './geospatial.css'

import BackToConceptsLink from '../../components/BackToConceptsLink'
import TrustStrip from '../../components/TrustStrip'
import { siteContent as site } from '../../brief/current'
import { usePageTitle } from '../usePageTitle'
import DhNav from './DhNav'
import DhHero from './DhHero'
import DhServices from './DhServices'
import DhReviews from './DhReviews'
import DhHours from './DhHours'
import DhQuoteCta from './DhQuoteCta'
import DhFooter from './DhFooter'

/** Bold Local: preset `bold-local` (navy blocks, safety orange, condensed Barlow). */
export default function GeospatialPage() {
  usePageTitle('geospatial')
  return (
    <div className="geospatial" id="top">
      <BackToConceptsLink />
      <DhNav />
      <main>
        <DhHero />
        <div className="dh-wrap">
          <TrustStrip site={site} />
        </div>
        <DhServices />
        <DhReviews />
        <DhHours />
        <DhQuoteCta />
      </main>
      <DhFooter />
    </div>
  )
}
