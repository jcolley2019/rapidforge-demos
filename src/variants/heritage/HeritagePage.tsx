import '@fontsource-variable/lexend'
import '@fontsource-variable/source-sans-3'
import './heritage.css'

import BackToConceptsLink from '../../components/BackToConceptsLink'
import TrustStrip from '../../components/TrustStrip'
import { siteContent as site } from '../../brief/current'
import { usePageTitle } from '../usePageTitle'
import PpNav from './PpNav'
import PpHero from './PpHero'
import PpServices from './PpServices'
import PpReviews from './PpReviews'
import PpHours from './PpHours'
import PpQuoteCta from './PpQuoteCta'
import PpFooter from './PpFooter'

/** Clean Trust: preset `clean-trust` (pale blue ground, blue and orange, Lexend). */
export default function HeritagePage() {
  usePageTitle('heritage')
  return (
    <div className="heritage" id="top">
      <BackToConceptsLink />
      <PpNav />
      <main>
        <PpHero />
        <div className="pp-wrap">
          <TrustStrip site={site} />
        </div>
        <PpServices />
        <PpReviews />
        <PpHours />
        <PpQuoteCta />
      </main>
      <PpFooter />
    </div>
  )
}
