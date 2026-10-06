import Stars from '../../components/Stars'
import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'

export default function IsReviews() {
  if (site.reviews.length === 0) return null
  return (
    <section id="reviews" className="is-black is-section">
      <div className="is-wrap">
        <Reveal>
          <p className="is-mono">Reviews</p>
          <h2 className="is-display is-h2">
            What Customers Say<span className="is-mark">.</span>
          </h2>
        </Reveal>
        <div className="is-quotes">
          {site.reviews.map((review, i) => (
            <Reveal key={i} delay={(i % 3) * 70}>
              <figure className="is-quote">
                <Stars rating={review.rating} className="is-stars" />
                <blockquote className="is-quote-text">&ldquo;{review.text}&rdquo;</blockquote>
                {review.author && <figcaption className="is-mono mt-5">{review.author}</figcaption>}
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
