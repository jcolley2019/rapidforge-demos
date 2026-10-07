import '@fontsource/bebas-neue/400.css'
import '@fontsource-variable/quicksand'
import './texas.css'

import AudienceStrip from '../../components/AudienceStrip'
import BackToConceptsLink from '../../components/BackToConceptsLink'
import BadgeRow from '../../components/BadgeRow'
import Offers from '../../components/Offers'
import ServiceAreas from '../../components/ServiceAreas'
import UtilityBar from '../../components/UtilityBar'
import { useSite } from '../../brief/site-context'
import { usePageTitle } from '../usePageTitle'
import VariantSite from '../VariantSite'
import IsNav from './IsNav'
import IsHero from './IsHero'
import IsServices from './IsServices'
import IsReviews from './IsReviews'
import IsHours from './IsHours'
import IsQuoteCta from './IsQuoteCta'
import IsFooter from './IsFooter'

/** Friendly Family: preset `friendly-family` (vault family F3 Royal Blue Fleet). */
export default function TexasPage() {
  usePageTitle('texas')
  return (
    <VariantSite slug="texas">
      <TexasBody />
    </VariantSite>
  )
}

function TexasBody() {
  const site = useSite()
  return (
    <div className="texas" id="top">
      <BackToConceptsLink />
      <UtilityBar site={site} wrapClassName="is-wrap" />
      <IsNav />
      <main>
        <IsHero />
        <Offers site={site} className="is-offers" wrapClassName="is-wrap" />
        <div className="is-wrap">
          {/* The rating already sits in the hero as a pill. */}
          <BadgeRow site={site} skip={['rating']} />
        </div>
        <IsServices />
        <ServiceAreas site={site} className="is-section is-areas" wrapClassName="is-wrap" titleClassName="is-display is-h2" />
        <AudienceStrip site={site} className="is-section is-who" wrapClassName="is-wrap" titleClassName="is-display is-h2" />
        <IsReviews />
        <IsHours />
        <IsQuoteCta />
      </main>
      <IsFooter />
    </div>
  )
}
