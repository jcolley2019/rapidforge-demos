import '@fontsource-variable/figtree'
import './cleanpro.css'

import BackToConceptsLink from '../../components/BackToConceptsLink'
import AnnouncementBar from './AnnouncementBar'
import CleanNav from './CleanNav'
import CleanHero from './CleanHero'
import TrustedByStrip from './TrustedByStrip'
import CleanServices from './CleanServices'
import WhyUs from './WhyUs'
import Process from './Process'
import StatsBand from './StatsBand'
import CleanTeam from './CleanTeam'
import TrackRecord from './TrackRecord'
import CleanQuoteCta from './CleanQuoteCta'
import CleanFooter from './CleanFooter'

export default function CleanProPage() {
  return (
    <div className="cleanpro" id="top">
      <BackToConceptsLink />
      <AnnouncementBar />
      <CleanNav />
      <main>
        <CleanHero />
        <TrustedByStrip />
        <CleanServices />
        <WhyUs />
        <Process />
        <StatsBand />
        <CleanTeam />
        <TrackRecord />
        <CleanQuoteCta />
      </main>
      <CleanFooter />
    </div>
  )
}
