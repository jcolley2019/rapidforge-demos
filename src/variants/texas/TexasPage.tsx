import '@fontsource-variable/oswald'
import '@fontsource-variable/archivo'
import './texas.css'

import BackToConceptsLink from '../../components/BackToConceptsLink'
import TxTopBar from './TxTopBar'
import TxNav from './TxNav'
import TxHero from './TxHero'
import TxStats from './TxStats'
import TxServices from './TxServices'
import TxBanner from './TxBanner'
import TxTechnology from './TxTechnology'
import TxTeam from './TxTeam'
import TxTrustedBy from './TxTrustedBy'
import TxQuoteCta from './TxQuoteCta'
import TxFooter from './TxFooter'

export default function TexasPage() {
  return (
    <div className="texas" id="top">
      <BackToConceptsLink />
      <TxTopBar />
      <TxNav />
      <main>
        <TxHero />
        <TxStats />
        <TxServices />
        <TxBanner />
        <TxTechnology />
        <TxTeam />
        <TxTrustedBy />
        <TxQuoteCta />
      </main>
      <TxFooter />
    </div>
  )
}
