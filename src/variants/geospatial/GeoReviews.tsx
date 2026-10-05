import Stars from '../../components/Stars'
import { siteContent as site } from '../../brief/current'
import Reveal from './Reveal'
import SectionTag from './SectionTag'
import Ticks from './Ticks'

export default function GeoReviews({ index }: { index: string }) {
  if (site.reviews.length === 0) return null
  return (
    <section id="reviews" className="border-y border-(--geo-line) bg-(--geo-base-deep)">
      <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <Reveal>
          <SectionTag index={index} label="Reviews" />
          <h2 className="mt-5 max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            Field reports
          </h2>
        </Reveal>
        <div className="g-matrix mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {site.reviews.map((review, i) => (
            <Reveal key={i} stagger={i % 3} delay={(i % 3) * 80}>
              <figure className="g-matrix-cell flex h-full flex-col">
                <Ticks className="opacity-40" />
                <div className="flex items-center justify-between gap-4">
                  <p className="g-meta g-num">LOG_{String(i + 1).padStart(2, '0')}</p>
                  <Stars rating={review.rating} className="g-mono text-xs tracking-[0.15em] text-(--geo-amber)" />
                </div>
                <blockquote className="mt-4 flex-1 text-[0.95rem] leading-relaxed">
                  &ldquo;{review.text}&rdquo;
                </blockquote>
                {review.author && (
                  <figcaption className="g-meta g-meta-amber mt-5">{review.author}</figcaption>
                )}
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
