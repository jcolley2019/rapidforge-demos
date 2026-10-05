import { siteContent as site } from '../../brief/current'
import { hasContactInfo, hoursLabel } from '../../brief/site-helpers'
import Reveal from './Reveal'

export default function CleanHours() {
  if (!hasContactInfo(site)) return null
  return (
    <section id="contact" className="cp-section" style={{ background: 'var(--cp-gray)' }}>
      <div className="cp-container">
        <Reveal>
          <div className="text-center">
            <p className="cp-eyebrow">Hours &amp; Contact</p>
            <h2 className="cp-h2">When and where to find us</h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {site.hours && (
            <Reveal delay={80}>
              <div className="cp-card h-full p-7">
                <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--cp-navy)' }}>
                  Hours
                </p>
                <table className="mt-4 w-full border-collapse text-[0.9375rem]">
                  <caption className="sr-only">Opening hours</caption>
                  <tbody>
                    {site.hours.map((row) => (
                      <tr key={row.day} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                        <th scope="row" className="py-2.5 pr-4 text-left font-semibold" style={{ color: 'var(--cp-navy)' }}>
                          {row.day}
                        </th>
                        <td className="cp-num py-2.5 text-right" style={{ color: 'var(--cp-navy-soft)' }}>
                          {hoursLabel(row)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          )}
          {(site.address || site.phoneHref) && (
            <Reveal delay={160}>
              <div className="cp-card h-full p-7">
                {site.address && (
                  <>
                    <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--cp-navy)' }}>
                      Address
                    </p>
                    <p className="mt-3 text-[0.9375rem]" style={{ color: 'var(--cp-navy-soft)' }}>
                      {site.address}
                    </p>
                  </>
                )}
                {site.phoneHref && (
                  <>
                    <p
                      className={`text-sm font-bold uppercase tracking-widest ${site.address ? 'mt-7' : ''}`}
                      style={{ color: 'var(--cp-navy)' }}
                    >
                      Phone
                    </p>
                    <a href={site.phoneHref} className="cp-inline-link cp-num mt-3 inline-block text-lg font-bold">
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
