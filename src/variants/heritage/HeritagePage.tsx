import '@fontsource/playfair-display/500.css'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/source-sans-3/400.css'
import '@fontsource/source-sans-3/600.css'
import './heritage.css'

import BackToConceptsLink from '../../components/BackToConceptsLink'
import UtilityBar from './UtilityBar'
import HeritageNav from './HeritageNav'
import Hero from './Hero'
import Legacy from './Legacy'
import StatsBar from './StatsBar'
import Services from './Services'
import Technology from './Technology'
import Team from './Team'
import TrustedBy from './TrustedBy'
import QuoteCta from './QuoteCta'
import HeritageFooter from './HeritageFooter'

export default function HeritagePage() {
  return (
    <div className="heritage" id="top">
      <div className="h-grain" aria-hidden="true" />
      <BackToConceptsLink />
      <UtilityBar />
      <HeritageNav />
      <main>
        <Hero />
        <Legacy />
        <StatsBar />
        <Services />
        <Technology />
        <Team />
        <TrustedBy />
        <QuoteCta />
      </main>
      <HeritageFooter />
    </div>
  )
}
