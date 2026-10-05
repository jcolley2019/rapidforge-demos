import Stars from '../../components/Stars'
import { siteContent as site } from '../../brief/current'
import Reveal from './Reveal'

export default function CleanReviews() {
  if (site.reviews.length === 0) return null
  return (
    <section id="reviews" className="cp-section" style={{ background: 'var(--cp-white)' }}>
      <div className="cp-container">
        <Reveal>
          <div className="text-center">
            <p className="cp-eyebrow">Reviews</p>
            <h2 className="cp-h2">What customers are saying</h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {site.reviews.map((review, i) => (
            <Reveal key={i} delay={(i % 3) * 90} stagger={i % 3}>
              <figure className="cp-card flex h-full flex-col p-7">
                <Stars rating={review.rating} className="text-base tracking-[0.15em]" />
                <blockquote
                  className="mt-4 flex-1 text-[0.9375rem] leading-relaxed"
                  style={{ color: 'var(--cp-navy)' }}
                >
                  &ldquo;{review.text}&rdquo;
                </blockquote>
                {review.author && (
                  <figcaption className="mt-5 text-sm font-semibold" style={{ color: 'var(--cp-navy-soft)' }}>
                    {review.author}
                  </figcaption>
                )}
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
