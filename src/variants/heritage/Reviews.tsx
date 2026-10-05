import Stars from '../../components/Stars'
import { siteContent as site } from '../../brief/current'
import Reveal from './Reveal'

export default function Reviews() {
  if (site.reviews.length === 0) return null
  return (
    <section id="reviews" className="bg-(--parchment-deep)">
      <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <Reveal>
          <div className="max-w-2xl">
            <p className="h-eyebrow">What customers say</p>
            <h2 className="h-display mt-4 text-3xl leading-tight font-semibold sm:text-4xl">
              In their words
            </h2>
            <hr className="h-rule h-rule-short h-rule-draw mt-7" />
          </div>
        </Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {site.reviews.map((review, i) => (
            <Reveal key={i} delay={(i % 3) * 90} stagger={i % 3}>
              <figure className="h-card p-6">
                <Stars rating={review.rating} className="h-num text-sm tracking-[0.2em] text-(--brass)" />
                <blockquote className="h-display mt-4 text-lg leading-snug font-medium italic">
                  &ldquo;{review.text}&rdquo;
                </blockquote>
                {review.author && (
                  <figcaption className="h-eyebrow mt-5 text-(--ink-faint)">
                    &mdash; {review.author}
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
