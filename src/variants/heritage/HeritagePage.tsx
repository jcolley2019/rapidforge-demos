import '@fontsource/playfair-display/500.css'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/source-sans-3/400.css'
import '@fontsource/source-sans-3/600.css'
import './heritage.css'

import BackToConceptsLink from '../../components/BackToConceptsLink'
import { usePageTitle } from '../usePageTitle'
import UtilityBar from './UtilityBar'
import HeritageNav from './HeritageNav'
import Hero from './Hero'
import Services from './Services'
import Reviews from './Reviews'
import HoursContact from './HoursContact'
import QuoteCta from './QuoteCta'
import HeritageFooter from './HeritageFooter'

export default function HeritagePage() {
  usePageTitle('heritage')
  return (
    <div className="heritage" id="top">
      <div className="h-grain" aria-hidden="true" />
      <BackToConceptsLink />
      <UtilityBar />
      <HeritageNav />
      <main>
        <Hero />
        <Services />
        <Reviews />
        <HoursContact />
        <QuoteCta />
      </main>
      <HeritageFooter />
    </div>
  )
}
