import { siteContent as site } from '../../brief/current'
import { hasContactInfo, hoursLabel } from '../../brief/site-helpers'
import Reveal from '../../components/Reveal'

export default function IsHours() {
  if (!hasContactInfo(site)) return null
  return (
    <section id="contact" className="is-surface is-section">
      <div className="is-wrap">
        <Reveal>
          <p className="is-mono">Hours</p>
          <h2 className="is-display is-h2">
            Hours &amp; Location<span className="is-mark">.</span>
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
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
              <div className="flex flex-col gap-7">
                {site.address && (
                  <div>
                    <p className="is-mono">Address</p>
                    <p className="is-display mt-2 text-2xl font-normal">{site.address}</p>
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
