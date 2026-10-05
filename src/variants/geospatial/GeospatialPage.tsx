import '@fontsource-variable/inter'
import './geospatial.css'

import BackToConceptsLink from '../../components/BackToConceptsLink'
import { usePageTitle } from '../usePageTitle'
import DhNav from './DhNav'
import DhHero from './DhHero'
import DhServices from './DhServices'
import DhReviews from './DhReviews'
import DhHours from './DhHours'
import DhQuoteCta from './DhQuoteCta'
import DhFooter from './DhFooter'

/** Dusk Horizon — preset `dusk-horizon` (vast quiet cinematic). */
export default function GeospatialPage() {
  usePageTitle('geospatial')
  return (
    <div className="geospatial" id="top">
      <BackToConceptsLink />
      <DhNav />
      <main>
        <DhHero />
        <DhServices />
        <DhReviews />
        <DhHours />
        <DhQuoteCta />
      </main>
      <DhFooter />
    </div>
  )
}
