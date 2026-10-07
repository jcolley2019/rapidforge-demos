import Stars from '../../components/Stars'
import { useSite } from '../../brief/site-context'
import Reveal from '../../components/Reveal'

export default function DhReviews() {
  const site = useSite()
  if (site.reviews.length === 0) return null
  return (
    <section id="reviews" className="dh-section dh-reviews">
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
                {review.author && <figcaption className="dh-cite">{review.author}</figcaption>}
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
