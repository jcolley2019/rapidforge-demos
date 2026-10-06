import '@fontsource/varela-round/400.css'
import '@fontsource-variable/nunito-sans'
import './texas.css'

import BackToConceptsLink from '../../components/BackToConceptsLink'
import TrustStrip from '../../components/TrustStrip'
import { siteContent as site } from '../../brief/current'
import { usePageTitle } from '../usePageTitle'
import IsNav from './IsNav'
import IsHero from './IsHero'
import IsServices from './IsServices'
import IsReviews from './IsReviews'
import IsHours from './IsHours'
import IsQuoteCta from './IsQuoteCta'
import IsFooter from './IsFooter'

/** Friendly Family: preset `friendly-family` (near-white, rounded, family blue and amber). */
export default function TexasPage() {
  usePageTitle('texas')
  return (
    <div className="texas" id="top">
      <BackToConceptsLink />
      <IsNav />
      <main>
        <IsHero />
        <div className="is-wrap">
          <TrustStrip site={site} />
        </div>
        <IsServices />
        <IsReviews />
        <IsHours />
        <IsQuoteCta />
      </main>
      <IsFooter />
    </div>
  )
}
