import { Fragment } from 'react'
import { content } from '../../content/content'
import Reveal from './Reveal'

export default function TxTrustedBy() {
  return (
    <section className="py-14" style={{ background: 'var(--tx-paper)', borderTop: '3px solid var(--tx-black)' }}>
      <div className="tx-container">
        <Reveal>
          <p className="tx-label" style={{ color: 'var(--tx-steel-on-light)' }}>
            Trusted by
          </p>
          <ul
            className="tx-display mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2"
            style={{ fontSize: 'var(--tx-t3)' }}
          >
            {content.trustedBy.map((client, i) => (
              <Fragment key={client}>
                {i > 0 && (
                  <li aria-hidden="true" style={{ color: 'var(--tx-orange)' }}>
                    /
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
