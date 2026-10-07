import Stars from '../../components/Stars'
import { useSite } from '../../brief/site-context'
import Reveal from '../../components/Reveal'

export default function WsReviews() {
  const site = useSite()
  if (site.reviews.length === 0) return null
  return (
    <section id="reviews" className="ws-section ws-black">
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
                {review.author && <figcaption className="ws-cite">{review.author}</figcaption>}
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
