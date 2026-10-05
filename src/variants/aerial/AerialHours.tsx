import { siteContent as site } from '../../brief/current'
import { hasContactInfo, hoursLabel } from '../../brief/site-helpers'
import Reveal from './Reveal'

export default function AerialHours() {
  if (!hasContactInfo(site)) return null
  return (
    <section className="ae-hours" id="contact" aria-label="Hours and contact">
      <div className="ae-wrap">
        <Reveal>
          <p className="ae-eyebrow">Hours &amp; contact</p>
          <h2 className="ae-hours-title">On the ground</h2>
        </Reveal>
        <div className="ae-hours-grid">
          {site.hours && (
            <Reveal>
              <table className="ae-hours-table">
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
            <Reveal stagger={1}>
              <address className="ae-contact">
                {site.address && (
                  <div>
                    <p className="ae-footer-heading">Address</p>
                    <p className="ae-contact-line">{site.address}</p>
                  </div>
                )}
                {site.phoneHref && (
                  <div>
                    <p className="ae-footer-heading">Phone</p>
                    <a href={site.phoneHref} className="ae-contact-line ae-link">
                      {site.phone}
                    </a>
                  </div>
                )}
              </address>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}
