import { siteContent as site } from '../../brief/current'
import { hasContactInfo, hoursLabel } from '../../brief/site-helpers'
import Reveal from '../../components/Reveal'

export default function PpHours() {
  if (!hasContactInfo(site)) return null
  return (
    <section id="contact" className="pp-section">
      <div className="pp-wrap">
        <Reveal>
          <div className="pp-head">
            <p className="pp-mono">Hours &amp; Contact</p>
            <h2 className="pp-display pp-h2">
              Find <em>us</em>
            </h2>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          {site.hours && (
            <Reveal delay={80}>
              <table className="pp-table">
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
              <div className="pp-contact">
                <span className="pp-reg pp-reg-tr" aria-hidden="true" />
                <span className="pp-reg pp-reg-bl" aria-hidden="true" />
                {site.address && (
                  <>
                    <p className="pp-mono">Address</p>
                    <p className="mt-1 text-(--pp-muted)">{site.address}</p>
                  </>
                )}
                {site.phoneHref && (
                  <>
                    <p className={`pp-mono ${site.address ? 'mt-6' : ''}`}>Phone</p>
                    <a href={site.phoneHref} className="pp-display pp-contact-phone pp-num">
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
