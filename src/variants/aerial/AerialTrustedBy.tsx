import { Fragment } from 'react'
import { content } from '../../content/content'
import Reveal from './Reveal'

export default function AerialTrustedBy() {
  return (
    <section className="ae-trusted" aria-label="Trusted by">
      <div className="ae-wrap">
        <Reveal>
          <p className="ae-trusted-line">
            <span className="ae-trusted-label">Trusted by</span>
            {content.trustedBy.map((client, i) => (
              <Fragment key={client}>
                {i > 0 && (
                  <span className="ae-trusted-dot" aria-hidden="true">
                    &middot;
                  </span>
                )}
                <span>{client}</span>
              </Fragment>
            ))}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
