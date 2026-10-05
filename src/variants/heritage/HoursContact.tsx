import { siteContent as site } from '../../brief/current'
import { hasContactInfo, hoursLabel } from '../../brief/site-helpers'
import Reveal from './Reveal'

export default function HoursContact() {
  if (!hasContactInfo(site)) return null
  return (
    <section id="contact" className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
      <Reveal>
        <div className="max-w-2xl">
          <p className="h-eyebrow">Hours &amp; contact</p>
          <h2 className="h-display mt-4 text-3xl leading-tight font-semibold sm:text-4xl">
            Find us
          </h2>
          <hr className="h-rule h-rule-short h-rule-draw mt-7" />
        </div>
      </Reveal>
      <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        {site.hours && (
          <Reveal delay={80}>
            <table className="w-full border-collapse text-[0.95rem]">
              <caption className="sr-only">Opening hours</caption>
              <tbody>
                {site.hours.map((row) => (
                  <tr key={row.day} className="border-b border-(--brass)/30">
                    <th scope="row" className="py-3 pr-6 text-left font-semibold">
                      {row.day}
                    </th>
                    <td className="h-num py-3 text-right text-(--ink-soft)">{hoursLabel(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        )}
        {(site.address || site.phoneHref) && (
          <Reveal delay={160}>
            <div className="border border-(--brass)/40 bg-(--parchment-deep) p-7">
              {site.address && (
                <>
                  <p className="h-eyebrow">Address</p>
                  <p className="mt-2 text-(--ink-soft)">{site.address}</p>
                </>
              )}
              {site.phoneHref && (
                <>
                  <p className={`h-eyebrow ${site.address ? 'mt-6' : ''}`}>Phone</p>
                  <a href={site.phoneHref} className="h-inline-link h-num mt-2 inline-block text-lg">
                    {site.phone}
                  </a>
                </>
              )}
            </div>
          </Reveal>
        )}
      </div>
    </section>
  )
}
