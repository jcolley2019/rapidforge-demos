import '@fontsource-variable/archivo'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/600.css'
import './geospatial.css'

import BackToConceptsLink from '../../components/BackToConceptsLink'
import TopBar from './TopBar'
import GeoNav from './GeoNav'
import GeoHero from './GeoHero'
import CapabilitiesStrip from './CapabilitiesStrip'
import GeoServices from './GeoServices'
import TechDeepDive from './TechDeepDive'
import GeoTeam from './GeoTeam'
import GeoTrustedBy from './GeoTrustedBy'
import GeoQuoteCta from './GeoQuoteCta'
import GeoFooter from './GeoFooter'

export default function GeospatialPage() {
  return (
    <div className="geospatial" id="top">
      <BackToConceptsLink />
      <TopBar />
      <GeoNav />
      <main>
        <GeoHero />
        <CapabilitiesStrip />
        <GeoServices />
        <TechDeepDive />
        <GeoTeam />
        <GeoTrustedBy />
        <GeoQuoteCta />
      </main>
      <GeoFooter />
    </div>
  )
}
