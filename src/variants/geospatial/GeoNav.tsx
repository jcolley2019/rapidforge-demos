import { content } from '../../content/content'

const links = [
  { label: 'Services', href: '#services' },
  { label: 'Technology', href: '#technology' },
  { label: 'Team', href: '#team' },
  { label: 'Contact', href: '#contact' },
]

export default function GeoNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-(--geo-line) bg-(--geo-base)/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
        <a href="#top" className="text-lg font-semibold tracking-tight">
          {content.shortName}
          <span className="text-(--geo-accent)">.</span>
        </a>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Page sections">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="g-navlink">
              {link.label}
            </a>
          ))}
        </nav>
        <a href="#contact" className="g-btn g-btn-accent !px-4 !py-2.5">
          Request Survey
        </a>
      </div>
    </header>
  )
}
