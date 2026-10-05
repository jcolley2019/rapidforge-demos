import { Fragment } from 'react'
import { content } from '../../content/content'
import Reveal from './Reveal'

export default function GeoTrustedBy() {
  return (
    <section className="border-y border-(--geo-line) bg-(--geo-base-deep)">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <Reveal>
          <p className="g-meta text-center">RELIED_ON_BY</p>
          <ul className="g-mono mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.78rem] tracking-[0.1em] text-(--geo-text-dim) uppercase sm:gap-x-8">
            {content.trustedBy.map((client, i) => (
              <Fragment key={client}>
                {i > 0 && (
                  <li aria-hidden="true" className="text-(--geo-accent)">
                    +
                  </li>
                )}
                <li>{client}</li>
              </Fragment>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
