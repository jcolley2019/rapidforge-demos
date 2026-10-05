import { content } from '../../content/content'

const links = [
  { href: '#services', label: 'Services' },
  { href: '#technology', label: 'Technology' },
  { href: '#team', label: 'Team' },
  { href: '#contact', label: 'Contact' },
]

export default function TxNav() {
  return (
    <nav
      className="sticky top-0 z-40"
      style={{ background: 'var(--tx-paper)', borderBottom: '3px solid var(--tx-black)' }}
    >
      <div className="tx-container flex items-center justify-between gap-4 py-3">
        <a href="#top" className="tx-display text-xl" style={{ color: 'var(--tx-black)' }}>
          Brittain <span style={{ color: 'var(--tx-orange)' }}>&amp;</span> Crawford
        </a>
        <div className="tx-label hidden items-center gap-8 md:flex" style={{ letterSpacing: '0.14em' }}>
          {links.map((l) => (
            <a key={l.href} href={l.href} className="tx-navlink" style={{ color: 'var(--tx-black)' }}>
              {l.label}
            </a>
          ))}
        </div>
        <a
          href={`mailto:${content.contact.quoteEmail}`}
          className="tx-btn tx-btn-orange !px-5 !py-2 text-sm"
        >
          Get a Quote
        </a>
      </div>
    </nav>
  )
}
