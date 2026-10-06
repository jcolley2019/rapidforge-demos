import '@fontsource-variable/fraunces'
import '@fontsource-variable/inter'
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

/** Paper Press: preset `paper-press` (warm paper, serif, one ember accent). */
export default function HeritagePage() {
  usePageTitle('heritage')
  return (
    <div className="heritage" id="top">
      <div className="pp-grain" aria-hidden="true" />
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
