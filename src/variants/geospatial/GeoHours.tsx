import { siteContent as site } from '../../brief/current'
import { hasContactInfo, hoursLabel } from '../../brief/site-helpers'
import Reveal from './Reveal'
import SectionTag from './SectionTag'
import Ticks from './Ticks'

export default function GeoHours({ index }: { index: string }) {
  if (!hasContactInfo(site)) return null
  return (
    <section id="contact" className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
      <Reveal>
        <SectionTag index={index} label="Hours / Contact" />
        <h2 className="mt-5 max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          Coordinates
        </h2>
      </Reveal>
      <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        {site.hours && (
          <Reveal delay={80}>
            <div className="relative border border-(--geo-line) bg-(--geo-panel) p-6 sm:p-8">
              <Ticks />
              <p className="g-eyebrow">Hours</p>
              <table className="g-mono mt-5 w-full border-collapse text-[0.8rem] tracking-[0.06em] uppercase">
                <caption className="sr-only">Opening hours</caption>
                <tbody>
                  {site.hours.map((row) => (
                    <tr key={row.day} className="border-b border-(--geo-line) last:border-b-0">
                      <th scope="row" className="py-2 pr-4 text-left font-medium text-(--geo-text-dim)">
                        {row.day}
                      </th>
                      <td className="py-2 text-right text-(--geo-text)">{hoursLabel(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        )}
        {(site.address || site.phoneHref) && (
          <Reveal delay={160}>
            <div className="relative h-full border border-(--geo-line) bg-(--geo-panel) p-6 sm:p-8">
              <Ticks />
              {site.address && (
                <>
                  <p className="g-eyebrow">Location</p>
                  <p className="mt-3 text-(--geo-text-dim)">{site.address}</p>
                </>
              )}
              {site.phoneHref && (
                <>
                  <p className={`g-eyebrow ${site.address ? 'mt-7' : ''}`}>Phone</p>
                  <a href={site.phoneHref} className="g-inline-link g-num mt-3 inline-block text-lg">
                    TEL {site.phone}
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
