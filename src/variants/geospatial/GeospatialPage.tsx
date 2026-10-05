import '@fontsource-variable/archivo'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/600.css'
import './geospatial.css'

import BackToConceptsLink from '../../components/BackToConceptsLink'
import { siteContent as site } from '../../brief/current'
import { hasContactInfo } from '../../brief/site-helpers'
import { usePageTitle } from '../usePageTitle'
import TopBar from './TopBar'
import GeoNav from './GeoNav'
import GeoHero from './GeoHero'
import GeoServices from './GeoServices'
import GeoReviews from './GeoReviews'
import GeoHours from './GeoHours'
import GeoQuoteCta from './GeoQuoteCta'
import GeoFooter from './GeoFooter'

const pad = (n: number) => String(n).padStart(2, '0')

export default function GeospatialPage() {
  usePageTitle('geospatial')
  let n = 1
  const servicesIndex = pad(n++)
  const reviewsIndex = site.reviews.length > 0 ? pad(n++) : null
  const hoursIndex = hasContactInfo(site) ? pad(n++) : null
  const quoteIndex = pad(n)
  return (
    <div className="geospatial" id="top">
      <BackToConceptsLink />
      <TopBar />
      <GeoNav />
      <main>
        <GeoHero />
        <GeoServices index={servicesIndex} />
        {reviewsIndex && <GeoReviews index={reviewsIndex} />}
        {hoursIndex && <GeoHours index={hoursIndex} />}
        <GeoQuoteCta index={quoteIndex} />
      </main>
      <GeoFooter />
    </div>
  )
}
