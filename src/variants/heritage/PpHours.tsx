import { useSite } from '../../brief/site-context'
import { hasContactInfo, hoursLabel } from '../../brief/site-helpers'
import Reveal from '../../components/Reveal'

export default function PpHours() {
  const site = useSite()
  if (!hasContactInfo(site)) return null
  return (
    <section id="contact" className="pp-section">
      <div className="pp-wrap">
        <Reveal>
          <h2 className="pp-display pp-h2">Hours &amp; Location</h2>
          {site.hoursNote && <p className="pp-hours-note">{site.hoursNote}</p>}
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
