import type { SiteContent } from '../brief/site-content'

/**
 * One line above the nav: the hours note and the towns served, then Call
 * and the page's book-or-request action. Renders nothing when the brief has
 * neither a utility line nor a phone. The line's parts after the first carry
 * `ub-more`, so a phone can keep the hours note and drop the towns rather
 * than cut both off mid-word. When the page's action already dials the
 * phone (a brief whose CTA is "Call ..."), only the call link shows, so the
 * number appears once. Structural class names only (ub, ub-line, ub-more,
 * ub-call, ub-book); each variant styles them in its own scope.
 */
export default function UtilityBar({ site, wrapClassName = '' }: { site: SiteContent; wrapClassName?: string }) {
  if (!site.utilityLine && !site.phoneHref) return null
  const parts = site.utilityLine ? site.utilityLine.split(' · ') : []
  const bookDials = site.phoneHref !== null && site.cta.href === site.phoneHref
  return (
    <div className="ub">
      <div className={`ub-inner ${wrapClassName}`.trim()}>
        {parts.length > 0 && (
          <p className="ub-line">
            {parts.map((part, i) => (
              <span key={part} className={i === 0 ? 'ub-part' : 'ub-part ub-more'}>
                {i > 0 && ' · '}
                {part}
              </span>
            ))}
          </p>
        )}
        <div className="ub-actions">
          {site.phoneHref && (
            <a href={site.phoneHref} className="ub-call">
              Call {site.phone}
            </a>
          )}
          {!bookDials && (
            <a href={site.cta.href} className="ub-book">
              {site.navCtaLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
