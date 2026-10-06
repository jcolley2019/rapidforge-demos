import Stars from '../../components/Stars'
import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'

export default function WsReviews() {
  if (site.reviews.length === 0) return null
  return (
    <section id="reviews" className="ws-section" style={{ background: 'var(--ws-surface)' }}>
      <div className="ws-wrap">
        <Reveal>
          <h2 className="ws-display ws-h2">What Customers Say</h2>
        </Reveal>
        <div className="ws-cards">
          {site.reviews.map((review, i) => (
            <Reveal key={i} delay={(i % 3) * 90}>
              <figure className="ws-card">
                <Stars rating={review.rating} className="ws-stars" />
                <blockquote className="ws-quote">&ldquo;{review.text}&rdquo;</blockquote>
                {review.author && <figcaption className="ws-mono mt-5">{review.author}</figcaption>}
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
