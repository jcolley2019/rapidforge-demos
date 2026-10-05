import '@fontsource-variable/outfit'
import './aerial.css'

import BackToConceptsLink from '../../components/BackToConceptsLink'
import { usePageTitle } from '../usePageTitle'
import AerialTopBar from './AerialTopBar'
import AerialHero from './AerialHero'
import AltitudeInterlude from './AltitudeInterlude'
import AerialCapabilities from './AerialCapabilities'
import AerialServices from './AerialServices'
import AerialReviews from './AerialReviews'
import AerialHours from './AerialHours'
import AerialQuoteCta from './AerialQuoteCta'
import AerialFooter from './AerialFooter'

export default function AerialPage() {
  usePageTitle('aerial')
  return (
    <div className="aerial" id="top">
      <BackToConceptsLink />
      <AerialTopBar />
      <main>
        <AerialHero />
        <AltitudeInterlude />
        <AerialCapabilities />
        <AerialServices />
        <AerialReviews />
        <AerialHours />
        <AerialQuoteCta />
      </main>
      <AerialFooter />
    </div>
  )
}
