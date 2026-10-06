import '@fontsource-variable/cormorant'
import '@fontsource-variable/montserrat'
import './cleanpro.css'

import BackToConceptsLink from '../../components/BackToConceptsLink'
import TrustStrip from '../../components/TrustStrip'
import { siteContent as site } from '../../brief/current'
import { usePageTitle } from '../usePageTitle'
import ClNav from './ClNav'
import ClHero from './ClHero'
import ClServices from './ClServices'
import ClReviews from './ClReviews'
import ClHours from './ClHours'
import ClQuoteCta from './ClQuoteCta'
import ClFooter from './ClFooter'

/** Premium Dark: preset `premium-dark` (black ground, gold accent, Cormorant). */
export default function CleanProPage() {
  usePageTitle('cleanpro')
  return (
    <div className="cleanpro" id="top">
      <BackToConceptsLink />
      <ClNav />
      <main>
        <ClHero />
        <div className="cl-wrap">
          <TrustStrip site={site} />
        </div>
        <ClServices />
        <ClReviews />
        <ClHours />
        <ClQuoteCta />
      </main>
      <ClFooter />
    </div>
  )
}
