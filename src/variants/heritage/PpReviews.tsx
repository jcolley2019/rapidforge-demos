import Stars from '../../components/Stars'
import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'

export default function PpReviews() {
  if (site.reviews.length === 0) return null
  return (
    <section id="reviews" className="pp-section" style={{ background: 'var(--pp-surface)' }}>
      <div className="pp-wrap">
        <Reveal>
          <div className="pp-head">
            <p className="pp-mono">Reviews</p>
            <h2 className="pp-display pp-h2">What Customers Say</h2>
          </div>
        </Reveal>
        <div className="pp-cards">
          {site.reviews.map((review, i) => (
            <Reveal key={i} delay={(i % 3) * 90}>
              <figure className="pp-card">
                <span className="pp-reg pp-reg-tl" aria-hidden="true" />
                <span className="pp-reg pp-reg-br" aria-hidden="true" />
                <Stars rating={review.rating} className="pp-stars" />
                <blockquote className="pp-quote mt-4">&ldquo;{review.text}&rdquo;</blockquote>
                {review.author && <figcaption className="pp-mono mt-5">{review.author}</figcaption>}
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
