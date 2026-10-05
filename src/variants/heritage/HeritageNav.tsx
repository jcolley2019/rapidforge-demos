import { content } from '../../content/content'

const links = [
  { label: 'Services', href: '#services' },
  { label: 'Technology', href: '#technology' },
  { label: 'Team', href: '#team' },
  { label: 'Contact', href: '#contact' },
]

export default function HeritageNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-(--brass)/30 bg-(--parchment)/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
        <a href="#top" className="h-display text-xl font-semibold tracking-tight">
          {content.shortName}
        </a>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Page sections">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="h-navlink">
              {link.label}
            </a>
          ))}
        </nav>
        <a href="#contact" className="h-btn h-btn-ink !px-4 !py-2.5">
          Request a Quote
        </a>
      </div>
    </header>
  )
}
