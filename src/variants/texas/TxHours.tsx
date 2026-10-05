import { siteContent as site } from '../../brief/current'
import { hasContactInfo, hoursLabel } from '../../brief/site-helpers'
import Reveal from './Reveal'

export default function TxHours() {
  if (!hasContactInfo(site)) return null
  return (
    <section id="contact" style={{ background: 'var(--tx-black)', color: 'var(--tx-paper)' }}>
      <div className="tx-container tx-section">
        <Reveal>
          <p className="tx-label" style={{ color: 'var(--tx-orange)' }}>
            Hours &amp; Contact
          </p>
          <h2 className="tx-display mt-3 max-w-[18ch]" style={{ fontSize: 'var(--tx-t5)' }}>
            Find us.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-10 md:grid-cols-2">
          {site.hours && (
            <Reveal>
              <table
                className="w-full border-collapse text-[0.9375rem]"
                style={{ borderTop: '1px solid var(--tx-steel-on-dark)' }}
              >
                <caption className="sr-only">Opening hours</caption>
                <tbody>
                  {site.hours.map((row) => (
                    <tr key={row.day} style={{ borderBottom: '1px solid var(--tx-steel-on-dark)' }}>
                      <th scope="row" className="tx-label py-3 pr-4 text-left" style={{ letterSpacing: '0.12em' }}>
                        {row.day}
                      </th>
                      <td className="tx-num py-3 text-right" style={{ color: 'var(--tx-steel-on-dark)' }}>
                        {hoursLabel(row)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          )}
          {(site.address || site.phoneHref) && (
            <Reveal>
              <div className="flex flex-col gap-8">
                {site.address && (
                  <div>
                    <p className="tx-label" style={{ color: 'var(--tx-steel-on-dark)' }}>
                      Address
                    </p>
                    <p className="tx-display mt-2" style={{ fontSize: 'var(--tx-t2)' }}>
                      {site.address}
                    </p>
                  </div>
                )}
                {site.phoneHref && (
                  <div>
                    <p className="tx-label" style={{ color: 'var(--tx-steel-on-dark)' }}>
                      Phone
                    </p>
                    <a
                      href={site.phoneHref}
                      className="tx-display tx-num tx-hot-link mt-2 inline-block"
                      style={{ fontSize: 'var(--tx-t4)' }}
                    >
                      {site.phone}
                    </a>
                  </div>
                )}
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}
