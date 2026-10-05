import { content } from '../../content/content'
import Reveal from './Reveal'

/**
 * A record of who the firm works for — stated as fact, not dressed as a
 * testimonial. There is no client quote and no rating to show, so the
 * section does not imply one.
 */
export default function TrackRecord() {
  const years = new Date().getFullYear() - content.founded.year

  return (
    <section className="cp-section" style={{ background: 'var(--cp-gray)' }}>
      <div className="cp-container max-w-4xl">
        <Reveal>
          <div className="cp-card p-9 sm:p-12">
            <p className="cp-eyebrow">Our track record</p>
            <p
              className="text-xl leading-relaxed font-semibold sm:text-2xl"
              style={{ color: 'var(--cp-navy)' }}
            >
              <span className="cp-num">{years}</span> years of continuous practice
              in Tarrant County, surveying for the engineering firms and public
              agencies that build North Texas.
            </p>
            <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {content.trustedBy.map((client) => (
                <li
                  key={client}
                  className="flex items-start gap-3 text-[0.9375rem]"
                  style={{ color: 'var(--cp-navy-soft)' }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="mt-1 shrink-0"
                    aria-hidden="true"
                  >
                    <circle cx="10" cy="10" r="9" fill="var(--cp-blue-tint)" />
                    <path
                      d="M6 10.3 8.8 13 14 7.4"
                      stroke="var(--cp-blue)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {client}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
