import { siteContent as site } from '../../brief/current'
import { hasContactInfo, hoursLabel } from '../../brief/site-helpers'
import Reveal from '../../components/Reveal'

export default function WsHours() {
  if (!hasContactInfo(site)) return null
  return (
    <section id="contact" className="ws-section">
      <div className="ws-wrap">
        <Reveal>
          <h2 className="ws-display ws-h2">Hours &amp; Location</h2>
        </Reveal>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          {site.hours && (
            <Reveal delay={80}>
              <table className="ws-table">
                <caption className="sr-only">Opening hours</caption>
                <tbody>
                  {site.hours.map((row) => (
                    <tr key={row.day}>
                      <th scope="row">{row.day}</th>
                      <td>{hoursLabel(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          )}
          {(site.address || site.phoneHref) && (
            <Reveal delay={160}>
              <div className="ws-contact">
                {site.address && (
                  <>
                    <p className="ws-mono">Address</p>
                    <p className="mt-1 text-(--ws-muted)">{site.address}</p>
                  </>
                )}
                {site.phoneHref && (
                  <>
                    <p className={`ws-mono ${site.address ? 'mt-6' : ''}`}>Phone</p>
                    <a href={site.phoneHref} className="ws-display ws-contact-phone ws-num">
                      {site.phone}
                    </a>
                  </>
                )}
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}
