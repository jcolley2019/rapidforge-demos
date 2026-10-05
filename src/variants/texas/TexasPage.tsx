import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/playfair-display/900.css'
import '@fontsource-variable/inter'
import './texas.css'

import BackToConceptsLink from '../../components/BackToConceptsLink'
import { usePageTitle } from '../usePageTitle'
import IsNav from './IsNav'
import IsHero from './IsHero'
import IsServices from './IsServices'
import IsReviews from './IsReviews'
import IsHours from './IsHours'
import IsQuoteCta from './IsQuoteCta'
import IsFooter from './IsFooter'

/** Ink Split — preset `ink-split` (dither mono). */
export default function TexasPage() {
  usePageTitle('texas')
  return (
    <div className="texas" id="top">
      <div className="is-grain" aria-hidden="true" />
      <BackToConceptsLink />
      <IsNav />
      <main>
        <IsHero />
        <IsServices />
        <IsReviews />
        <IsHours />
        <IsQuoteCta />
      </main>
      <IsFooter />
    </div>
  )
}
