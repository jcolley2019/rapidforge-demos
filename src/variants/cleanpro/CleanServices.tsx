import type { ReactNode } from 'react'
import { content } from '../../content/content'
import Reveal from './Reveal'

/* Simple line icons, one per service, in content.ts service order. */
const icons: ReactNode[] = [
  // Boundary & ALTA — map with pin
  <path key="i" d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20V6.5Zm6-2.5v13.5M15 6.5V20" />,
  // Topographic as-built — stacked layers
  <path key="i" d="m12 3 9 5-9 5-9-5 9-5Zm-9 9.5 9 5 9-5M3 16.5l9 5 9-5" transform="scale(0.92) translate(1 0.5)" />,
  // Topographic design — nested contours
  <path key="i" d="M12 20c-5 0-8.5-2.6-8.5-6S7 6 12 6s8.5 4.4 8.5 8-3.5 6-8.5 6Zm0-3.5c-2.8 0-4.8-1.2-4.8-2.9S9.2 10 12 10s4.8 1.9 4.8 3.6-2 2.9-4.8 2.9Zm0-3.2v.5" />,
  // Plats — document grid
  <path key="i" d="M5 3h14v18H5V3Zm0 6h14M5 15h14M12 3v18" />,
  // Right-of-way — road with dashes
  <path key="i" d="M8 21 10 3h4l2 18H8Zm4-16v2.5m0 3.5v2.5m0 3.5V19" />,
  // Easement — dashed corridor
  <path key="i" d="M4 4c6 2 4 7 10 8s6 6 6 8M4 20v-4m0-4v-2m0-4V4h4m4 0h2m4 0h2" />,
  // Drone — quadcopter
  <path key="i" d="M4 5a2.5 2.5 0 1 0 3 3m-3-3a2.5 2.5 0 1 1 3 3m-3-3 3 3m13-3a2.5 2.5 0 1 1-3 3m3-3a2.5 2.5 0 1 0-3 3m3-3-3 3M4 19a2.5 2.5 0 1 0 3-3m-3 3a2.5 2.5 0 1 1 3-3m-3 3 3-3m13 3a2.5 2.5 0 1 1-3-3m3 3a2.5 2.5 0 1 0-3-3m3 3-3-3m-7-2h4v-4h-4v4Z" />,
  // 3D laser scanning — beams
  <path key="i" d="M12 12 3 7m9 5 9-5m-9 5v9m0-9L6 4m6 8 6-8m-6 8V3m-2 9.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />,
  // Terrain models — mountain in cube
  <path key="i" d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm-6.5 12.5 4-3.5 3 2.5 4.5-4" />,
]

export default function CleanServices() {
  return (
    <section id="services" className="cp-section" style={{ background: 'var(--cp-gray)' }}>
      <div className="cp-container">
        <Reveal>
          <div className="text-center">
            <p className="cp-eyebrow">What We Do</p>
            <h2 className="cp-h2">Surveying services for every stage of your project</h2>
            <p className="cp-lead mx-auto mt-4">
              From boundary determinations to 3D laser scanning, our licensed team delivers the
              accurate data your project is built on.
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {content.services.map((service, i) => (
            <Reveal key={service.title} delay={(i % 3) * 90} stagger={i % 3}>
              <div className="cp-card group flex h-full flex-col p-7">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: 'var(--cp-blue-tint)' }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--cp-blue)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {icons[i]}
                  </svg>
                </span>
                <h3 className="mt-5 text-lg font-bold leading-snug" style={{ color: 'var(--cp-navy)' }}>
                  {service.title}
                </h3>
                <p className="mt-3 flex-1 text-[0.9375rem]" style={{ color: 'var(--cp-navy-soft)' }}>
                  {service.description}
                </p>
                <a href="#contact" className="cp-cardlink mt-5">
                  Ask about this survey
                  <span className="cp-cardlink-mark" aria-hidden="true">
                    &rarr;
                  </span>
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
