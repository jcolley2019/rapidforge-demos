import { useSite } from '../../brief/site-context'
import { hasContactInfo, hoursLabel } from '../../brief/site-helpers'
import Reveal from '../../components/Reveal'

export default function DhHours() {
  const site = useSite()
  if (!hasContactInfo(site)) return null
  return (
    <section id="contact" className="dh-section">
      <div className="dh-wrap">
        <Reveal>
          <h2 className="dh-display dh-h2">Hours &amp; Location</h2>
          {site.hoursNote && <p className="dh-hours-note">{site.hoursNote}</p>}
        </Reveal>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          {site.hours && (
            <Reveal delay={80}>
              <table className="dh-table">
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
              <div className="dh-contact">
                {site.address && (
                  <>
                    <p className="dh-mono">Address</p>
                    <p className="mt-1 text-(--dh-muted)">{site.address}</p>
                  </>
                )}
                {site.phoneHref && (
                  <>
                    <p className={`dh-mono ${site.address ? 'mt-6' : ''}`}>Phone</p>
                    <a href={site.phoneHref} className="dh-contact-phone dh-num">
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
