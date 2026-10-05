import { Link } from 'react-router-dom'
import './BackToConceptsLink.css'

/**
 * Fixed link back to the variant picker. Must persist on every finished
 * variant page so the client can always hop between concepts. It reads its
 * colours from the hosting variant (see BackToConceptsLink.css).
 */
export default function BackToConceptsLink() {
  return (
    <Link to="/" className="bc-back">
      <span className="bc-back-mark" aria-hidden="true">
        &larr;
      </span>
      All concepts
    </Link>
  )
}
