import '@fontsource-variable/outfit'
import '@fontsource-variable/work-sans'
import './aerial.css'

import BackToConceptsLink from '../../components/BackToConceptsLink'
import TrustStrip from '../../components/TrustStrip'
import { siteContent as site } from '../../brief/current'
import { usePageTitle } from '../usePageTitle'
import WsNav from './WsNav'
import WsHero from './WsHero'
import WsServices from './WsServices'
import WsReviews from './WsReviews'
import WsHours from './WsHours'
import WsQuoteCta from './WsQuoteCta'
import WsFooter from './WsFooter'

/** Modern Minimal: preset `modern-minimal` (white, hairlines, one blue accent, Outfit). */
export default function AerialPage() {
  usePageTitle('aerial')
  return (
    <div className="aerial" id="top">
      <BackToConceptsLink />
      <WsNav />
      <main>
        <WsHero />
        <div className="ws-wrap">
          <TrustStrip site={site} />
        </div>
        <WsServices />
        <WsReviews />
        <WsHours />
        <WsQuoteCta />
      </main>
      <WsFooter />
    </div>
  )
}
