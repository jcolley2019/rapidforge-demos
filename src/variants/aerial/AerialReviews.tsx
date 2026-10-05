import Stars from '../../components/Stars'
import { siteContent as site } from '../../brief/current'
import Reveal from './Reveal'

export default function AerialReviews() {
  if (site.reviews.length === 0) return null
  return (
    <section className="ae-reviews" id="reviews" aria-label="Reviews">
      <div className="ae-wrap">
        <Reveal>
          <p className="ae-eyebrow">Reviews</p>
          <h2 className="ae-reviews-title">From the people we work for</h2>
        </Reveal>
        <div className="ae-review-grid">
          {site.reviews.map((review, i) => (
            <Reveal key={i} stagger={i}>
              <figure className="ae-review">
                <Stars rating={review.rating} className="ae-stars" />
                <blockquote className="ae-review-text">&ldquo;{review.text}&rdquo;</blockquote>
                {review.author && <figcaption className="ae-review-author">{review.author}</figcaption>}
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
