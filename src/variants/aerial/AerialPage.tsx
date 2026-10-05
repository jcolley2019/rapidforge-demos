import '@fontsource-variable/outfit'
import './aerial.css'

import BackToConceptsLink from '../../components/BackToConceptsLink'
import AerialTopBar from './AerialTopBar'
import AerialHero from './AerialHero'
import AltitudeInterlude from './AltitudeInterlude'
import AerialCapabilities from './AerialCapabilities'
import GroundServices from './GroundServices'
import AerialStats from './AerialStats'
import AerialTeam from './AerialTeam'
import AerialTrustedBy from './AerialTrustedBy'
import AerialQuoteCta from './AerialQuoteCta'
import AerialFooter from './AerialFooter'

export default function AerialPage() {
  return (
    <div className="aerial" id="top">
      <BackToConceptsLink />
      <AerialTopBar />
      <main>
        <AerialHero />
        <AltitudeInterlude />
        <AerialCapabilities />
        <GroundServices />
        <AerialStats />
        <AerialTeam />
        <AerialTrustedBy />
        <AerialQuoteCta />
      </main>
      <AerialFooter />
    </div>
  )
}
