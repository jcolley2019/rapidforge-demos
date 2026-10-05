import { siteContent as site } from '../../brief/current'
import { hasContactInfo, hoursLabel } from '../../brief/site-helpers'
import Reveal from '../../components/Reveal'

export default function ClHours() {
  if (!hasContactInfo(site)) return null
  return (
    <section id="contact" className="cl-section">
      <div className="cl-wrap">
        <Reveal>
          <p className="cl-eyebrow">Hours &amp; Contact</p>
          <h2 className="cl-display cl-h2">
            Find <em>us</em>
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          {site.hours && (
            <Reveal delay={80}>
              <table className="cl-table">
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
              <div className="cl-contact">
                {site.address && (
                  <>
                    <p className="cl-mono">Address</p>
                    <p className="mt-1 text-(--cl-muted)">{site.address}</p>
                  </>
                )}
                {site.phoneHref && (
                  <>
                    <p className={`cl-mono ${site.address ? 'mt-6' : ''}`}>Phone</p>
                    <a href={site.phoneHref} className="cl-display cl-contact-phone cl-num">
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
