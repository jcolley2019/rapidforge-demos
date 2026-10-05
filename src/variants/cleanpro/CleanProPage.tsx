import '@fontsource-variable/eb-garamond'
import '@fontsource-variable/figtree'
import './cleanpro.css'

import BackToConceptsLink from '../../components/BackToConceptsLink'
import { usePageTitle } from '../usePageTitle'
import ClNav from './ClNav'
import ClHero from './ClHero'
import ClServices from './ClServices'
import ClReviews from './ClReviews'
import ClHours from './ClHours'
import ClQuoteCta from './ClQuoteCta'
import ClFooter from './ClFooter'

/** Classic Light — preset `classic-light` (classical remix). */
export default function CleanProPage() {
  usePageTitle('cleanpro')
  return (
    <div className="cleanpro" id="top">
      <BackToConceptsLink />
      <ClNav />
      <main>
        <ClHero />
        <ClServices />
        <ClReviews />
        <ClHours />
        <ClQuoteCta />
      </main>
      <ClFooter />
    </div>
  )
}
