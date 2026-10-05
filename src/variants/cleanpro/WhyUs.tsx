import { content } from '../../content/content'
import Reveal from './Reveal'

const props = [
  {
    title: 'Accuracy & Licensure',
    copy: `Four Registered Professional Land Surveyors stand behind every sealed survey. Our work meets the exacting standards of lenders, title companies, and public agencies.`,
    icon: (
      <path d="m12 3 7 3v5c0 4.5-3 8.2-7 9.5-4-1.3-7-5-7-9.5V6l7-3Zm-3 9 2.2 2.2L15.5 9.9" />
    ),
  },
  {
    title: 'Modern Technology',
    copy: 'On-network GNSS tied to the Texas State Plane coordinate system, FAA-compliant drone mapping, and 3D laser scanning capture your site faster and in richer detail.',
    icon: (
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm0-5.5v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1M7.7 16.3l-2.1 2.1" />
    ),
  },
  {
    title: '50 Years of Local Knowledge',
    copy: `Surveying ${content.serviceArea} since ${content.founded.year}. Five decades of courthouse research, boundary law, and municipal experience inform every project.`,
    icon: (
      <path d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Zm0-14v5l3.5 2" />
    ),
  },
]

export default function WhyUs() {
  return (
    <section id="why-us" className="cp-section" style={{ background: 'var(--cp-white)' }}>
      <div className="cp-container">
        <Reveal>
          <div className="text-center">
            <p className="cp-eyebrow">Why Brittain &amp; Crawford</p>
            <h2 className="cp-h2">The firm engineers keep coming back to</h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {props.map((p, i) => (
            <Reveal key={p.title} delay={i * 100} stagger={i}>
              <div className="text-center md:text-left">
                <span
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl md:mx-0"
                  style={{ background: 'var(--cp-blue-tint)' }}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--cp-blue)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {p.icon}
                  </svg>
                </span>
                <h3 className="mt-5 text-xl font-bold" style={{ color: 'var(--cp-navy)' }}>
                  {p.title}
                </h3>
                <p className="mt-3 text-[0.9375rem]" style={{ color: 'var(--cp-navy-soft)' }}>
                  {p.copy}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
