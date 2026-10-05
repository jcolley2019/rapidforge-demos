import { Fragment } from 'react'
import { content } from '../../content/content'
import Reveal from './Reveal'

export default function TrustedBy() {
  return (
    <section className="border-y border-(--brass)/30 bg-(--parchment-deep)/60">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <Reveal>
          <p className="h-eyebrow text-center">Trusted by</p>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:gap-x-7">
            {content.trustedBy.map((client, i) => (
              <Fragment key={client}>
                {i > 0 && (
                  <li aria-hidden="true" className="text-[0.55rem] text-(--brass)">
                    &#9670;
                  </li>
                )}
                <li className="h-display text-lg font-medium text-(--ink-soft) italic">
                  {client}
                </li>
              </Fragment>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
