import PlaceholderImage from '../../components/PlaceholderImage'
import { content } from '../../content/content'
import Reveal from './Reveal'
import SectionTag from './SectionTag'
import Ticks from './Ticks'

const gnssStat = content.stats.find((s) => s.label.includes('GNSS'))!
const droneService = content.services.find((s) => s.title.includes('Drone'))!
const laserService = content.services.find((s) => s.title.includes('Laser'))!
const terrainService = content.services.find((s) => s.title.includes('Terrain'))!

function SpecRow({ k, v, amber = false }: { k: string; v: string; amber?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-(--geo-line) py-2 last:border-b-0">
      <span className="g-meta">{k}</span>
      <span
        className={`g-mono text-[0.72rem] tracking-[0.08em] uppercase ${
          amber ? 'g-meta-amber' : 'text-(--geo-text-dim)'
        }`}
      >
        {v}
      </span>
    </div>
  )
}

export default function TechDeepDive() {
  return (
    <section id="technology" className="border-y border-(--geo-line) bg-(--geo-base-deep)">
      <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <Reveal>
          <SectionTag index="02" label="Technology" />
          <h2 className="mt-5 max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            The most advanced gear in North Texas
          </h2>
        </Reveal>

        {/* Panel A — GNSS / State Plane, full width */}
        <Reveal delay={120}>
          <article className="relative mt-12 grid overflow-hidden border border-(--geo-line) bg-(--geo-panel) lg:grid-cols-[1.1fr_0.9fr]">
            <Ticks className="z-10" />
            <div className="p-7 sm:p-10">
              <p className="g-eyebrow">GNSS / Texas State Plane</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                Positioning you can take to the courthouse
              </h3>
              <p className="mt-4 max-w-lg text-(--geo-text-dim)">
                {gnssStat.value} {gnssStat.label.charAt(0).toLowerCase() + gnssStat.label.slice(1)}.
                Every crew observes on the same network, so every corner, every
                monument, and every deliverable lands in one authoritative
                coordinate frame.
              </p>
              <div className="mt-7 max-w-sm">
                <SpecRow k="DATUM" v="NAD83" />
                <SpecRow k="ZONE" v="TX_NORTH_CENTRAL_4202" />
                <SpecRow k="RECEIVERS" v={`${gnssStat.value}_ON_NETWORK`} />
                <SpecRow k="FIELD_CREWS" v={`${content.stats[2].value}_TWO-MAN`} amber />
              </div>
            </div>
            <div className="relative min-h-64 border-t border-(--geo-line) lg:border-t-0 lg:border-l">
              <PlaceholderImage
                aspectRatio="auto"
                gradientFrom="#0c1310"
                gradientTo="#12241c"
                lineColor="#3ddc97"
                lineOpacity={0.5}
                seed={11}
                className="absolute inset-0 h-full w-full"
                label="GNSS control network — placeholder"
                labelColor="#96a69d"
              />
            </div>
          </article>
        </Reveal>

        {/* Panels B & C — drone + laser */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {[
            {
              service: droneService,
              eyebrow: 'Aerial / UAS',
              seed: 23,
              specs: [
                { k: 'PLATFORM', v: 'UAS_MULTIROTOR' },
                { k: 'OUTPUT', v: 'ORTHO / DSM / IMAGERY' },
                { k: 'COVERAGE', v: 'LARGE_SITE_FAST', amber: true },
              ],
            },
            {
              service: laserService,
              eyebrow: 'LiDAR / Scanning',
              seed: 31,
              specs: [
                { k: 'CAPTURE', v: 'INT + EXT_POINT_CLOUD' },
                { k: 'DENSITY', v: 'MILLIONS_OF_PTS/MIN' },
                { k: 'EXHIBITS', v: terrainService.title.includes('3D') ? '3D_TERRAIN_MODELS' : 'CUSTOM', amber: true },
              ],
            },
          ].map((panel, i) => (
            <Reveal key={panel.service.title} delay={i * 120} stagger={i}>
              <article className="relative flex h-full flex-col overflow-hidden border border-(--geo-line) bg-(--geo-panel)">
                <Ticks className="z-10" />
                <PlaceholderImage
                  aspectRatio="16 / 7"
                  gradientFrom="#0c1310"
                  gradientTo="#12241c"
                  lineColor={i === 0 ? '#3ddc97' : '#f5a524'}
                  lineOpacity={0.45}
                  seed={panel.seed}
                  className="border-b border-(--geo-line)"
                />
                <div className="flex flex-1 flex-col p-7">
                  <p className="g-eyebrow">{panel.eyebrow}</p>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight">
                    {panel.service.title}
                  </h3>
                  <p className="mt-3 text-sm text-(--geo-text-dim)">
                    {panel.service.description}
                  </p>
                  <div className="mt-auto pt-6">
                    {panel.specs.map((s) => (
                      <SpecRow key={s.k} k={s.k} v={s.v} amber={s.amber} />
                    ))}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={100}>
          <p className="g-meta mt-8">
            + {terrainService.title}: {terrainService.description}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
