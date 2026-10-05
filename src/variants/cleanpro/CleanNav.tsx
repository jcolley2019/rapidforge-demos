import { useEffect, useState } from 'react'
import { content } from '../../content/content'

const links = [
  { href: '#services', label: 'Services' },
  { href: '#why-us', label: 'Why Us' },
  { href: '#process', label: 'Process' },
  { href: '#team', label: 'Team' },
  { href: '#contact', label: 'Contact' },
]

export default function CleanNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className="sticky top-0 z-40 bg-white transition-shadow duration-300"
      style={{ boxShadow: scrolled ? 'var(--cp-shadow-soft)' : 'none' }}
    >
      <div className="cp-container flex items-center justify-between gap-4 px-6 py-4">
        <a href="#top" className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--cp-navy)' }}>
          Brittain <span style={{ color: 'var(--cp-blue)' }}>&amp;</span> Crawford
        </a>
        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="cp-navlink">
              {l.label}
            </a>
          ))}
        </div>
        <a href={`mailto:${content.contact.quoteEmail}`} className="cp-btn cp-btn-primary !px-5 !py-2.5 text-sm">
          Get a Quote
        </a>
      </div>
    </nav>
  )
}
