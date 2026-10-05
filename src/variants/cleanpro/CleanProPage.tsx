import '@fontsource-variable/figtree'
import './cleanpro.css'

import BackToConceptsLink from '../../components/BackToConceptsLink'
import { usePageTitle } from '../usePageTitle'
import AnnouncementBar from './AnnouncementBar'
import CleanNav from './CleanNav'
import CleanHero from './CleanHero'
import CleanServices from './CleanServices'
import CleanReviews from './CleanReviews'
import CleanHours from './CleanHours'
import CleanQuoteCta from './CleanQuoteCta'
import CleanFooter from './CleanFooter'

export default function CleanProPage() {
  usePageTitle('cleanpro')
  return (
    <div className="cleanpro" id="top">
      <BackToConceptsLink />
      <AnnouncementBar />
      <CleanNav />
      <main>
        <CleanHero />
        <CleanServices />
        <CleanReviews />
        <CleanHours />
        <CleanQuoteCta />
      </main>
      <CleanFooter />
    </div>
  )
}
