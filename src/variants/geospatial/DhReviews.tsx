import Stars from '../../components/Stars'
import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'

export default function DhReviews() {
  if (site.reviews.length === 0) return null
  return (
    <section id="reviews" className="dh-section">
      <div className="dh-wrap">
        <Reveal>
          <h2 className="dh-display dh-h2">What Customers Say</h2>
        </Reveal>
        <div className="dh-panels">
          {site.reviews.map((review, i) => (
            <Reveal key={i} delay={(i % 3) * 90}>
              <figure className="dh-panel">
                <Stars rating={review.rating} className="dh-stars" />
                <blockquote className="dh-quote">&ldquo;{review.text}&rdquo;</blockquote>
                {review.author && <figcaption className="dh-mono mt-5">{review.author}</figcaption>}
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
