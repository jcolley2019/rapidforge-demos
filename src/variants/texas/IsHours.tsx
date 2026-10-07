import { useSite } from '../../brief/site-context'
import { hasContactInfo, hoursLabel } from '../../brief/site-helpers'
import Reveal from '../../components/Reveal'

export default function IsHours() {
  const site = useSite()
  if (!hasContactInfo(site)) return null
  return (
    <section id="contact" className="is-section is-grey">
      <div className="is-wrap">
        <Reveal>
          <h2 className="is-display is-h2">Hours &amp; Location</h2>
          {site.hoursNote && <p className="is-hours-note">{site.hoursNote}</p>}
        </Reveal>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          {site.hours && (
            <Reveal delay={70}>
              <table className="is-table">
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
            <Reveal delay={140}>
              <div className="is-contact">
                {site.address && (
                  <div>
                    <p className="is-mono">Address</p>
                    <p className="mt-1">{site.address}</p>
                  </div>
                )}
                {site.phoneHref && (
                  <div>
                    <p className="is-mono">Phone</p>
                    <a href={site.phoneHref} className="is-display is-contact-phone is-num">
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
