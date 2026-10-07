import Stars from '../../components/Stars'
import { useSite } from '../../brief/site-context'
import Reveal from '../../components/Reveal'

export default function PpReviews() {
  const site = useSite()
  if (site.reviews.length === 0) return null
  return (
    <section id="reviews" className="pp-section pp-reviews">
      <div className="pp-wrap">
        <Reveal>
          <h2 className="pp-display pp-h2">What Customers Say</h2>
        </Reveal>
        <div className="pp-cards">
          {site.reviews.map((review, i) => (
            <Reveal key={i} delay={(i % 3) * 90}>
              <figure className="pp-card">
                <Stars rating={review.rating} className="pp-stars" />
                <blockquote className="pp-quote">&ldquo;{review.text}&rdquo;</blockquote>
                {review.author && <figcaption className="pp-cite">{review.author}</figcaption>}
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
