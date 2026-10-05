import Stars from '../../components/Stars'
import { siteContent as site } from '../../brief/current'
import Reveal from './Reveal'

export default function TxReviews() {
  if (site.reviews.length === 0) return null
  return (
    <section id="reviews" className="tx-section" style={{ background: 'var(--tx-paper)' }}>
      <div className="tx-container">
        <Reveal>
          <p className="tx-label" style={{ color: 'var(--tx-orange-deep)' }}>
            Reviews
          </p>
          <h2 className="tx-display mt-3 max-w-[20ch]" style={{ fontSize: 'var(--tx-t5)' }}>
            Straight from the customer.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {site.reviews.map((review, i) => (
            <Reveal
              key={i}
              className="tx-reveal-stagger"
              style={{ '--tx-ar': `${i * 5}%` } as React.CSSProperties}
            >
              <figure
                className="flex h-full flex-col p-6"
                style={{
                  background: 'var(--tx-black)',
                  color: 'var(--tx-paper)',
                  borderTop: '4px solid var(--tx-orange)',
                }}
              >
                <Stars rating={review.rating} className="tx-num text-sm tracking-[0.2em]" />
                <blockquote className="tx-display mt-4 flex-1" style={{ fontSize: 'var(--tx-t2)', lineHeight: 1.3 }}>
                  &ldquo;{review.text}&rdquo;
                </blockquote>
                {review.author && (
                  <figcaption className="tx-label mt-5" style={{ color: 'var(--tx-steel-on-dark)', letterSpacing: '0.12em' }}>
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
