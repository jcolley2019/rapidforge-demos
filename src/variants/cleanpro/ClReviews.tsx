import Stars from '../../components/Stars'
import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'

export default function ClReviews() {
  if (site.reviews.length === 0) return null
  return (
    <section id="reviews" className="cl-section" style={{ background: 'var(--cl-surface)' }}>
      <div className="cl-wrap">
        <Reveal>
          <p className="cl-eyebrow">Reviews</p>
          <h2 className="cl-display cl-h2">
            In their <em>words</em>
          </h2>
        </Reveal>
        <div className="cl-cards">
          {site.reviews.map((review, i) => (
            <Reveal key={i} delay={(i % 3) * 90}>
              <figure className="cl-card">
                <Stars rating={review.rating} className="cl-stars" />
                <blockquote className="cl-display cl-quote">&ldquo;{review.text}&rdquo;</blockquote>
                {review.author && <figcaption className="cl-mono mt-5">{review.author}</figcaption>}
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
