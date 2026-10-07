import { Link, useLocation } from 'react-router-dom'
import './BackToConceptsLink.css'

/**
 * Fixed link back to the variant picker. Must persist on every finished
 * variant page so the client can always hop between concepts. It keeps the
 * query string, so a commercial preview returns to the commercial picker.
 * It reads its colours from the hosting variant (see BackToConceptsLink.css).
 */
export default function BackToConceptsLink() {
  const { search } = useLocation()
  return (
    <Link to={{ pathname: '/', search }} className="bc-back">
      <span className="bc-back-mark" aria-hidden="true">
        &larr;
      </span>
      All concepts
    </Link>
  )
}
