import { Fragment } from 'react'
import { siteContent as site } from '../../brief/current'
import { localityLine } from '../../brief/site-helpers'
import Reveal from './Reveal'

/** Orange statement band: the service list, read as one line. */
export default function TxBanner() {
  const items = [...site.services.map((s) => s.title), localityLine(site)]
  return (
    <section className="tx-on-orange" style={{ background: 'var(--tx-orange)', color: 'var(--tx-black)' }}>
      <div className="tx-container py-14">
        <Reveal>
          <p className="tx-display" style={{ fontSize: 'var(--tx-t3)', lineHeight: 1.25 }}>
            {items.map((item, i) => (
              <Fragment key={item}>
                {i > 0 && ' · '}
                {item}
              </Fragment>
            ))}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
