import '@fontsource-variable/oswald'
import '@fontsource-variable/archivo'
import './texas.css'

import BackToConceptsLink from '../../components/BackToConceptsLink'
import { usePageTitle } from '../usePageTitle'
import TxTopBar from './TxTopBar'
import TxNav from './TxNav'
import TxHero from './TxHero'
import TxServices from './TxServices'
import TxBanner from './TxBanner'
import TxReviews from './TxReviews'
import TxHours from './TxHours'
import TxQuoteCta from './TxQuoteCta'
import TxFooter from './TxFooter'

export default function TexasPage() {
  usePageTitle('texas')
  return (
    <div className="texas" id="top">
      <BackToConceptsLink />
      <TxTopBar />
      <TxNav />
      <main>
        <TxHero />
        <TxServices />
        <TxBanner />
        <TxReviews />
        <TxHours />
        <TxQuoteCta />
      </main>
      <TxFooter />
    </div>
  )
}
