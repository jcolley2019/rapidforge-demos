import { siteContent as site } from '../../brief/current'

/** Wordmark: first word in navy, the rest in blue. */
export default function Brand({ className = '' }: { className?: string }) {
  const [first, ...rest] = site.shortName.split(' ')
  return (
    <span className={className} style={{ color: 'var(--cp-navy)' }}>
      {first}
      {rest.length > 0 && <span style={{ color: 'var(--cp-blue)' }}> {rest.join(' ')}</span>}
    </span>
  )
}
