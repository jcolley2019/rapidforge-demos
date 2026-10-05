import { siteContent as site } from '../../brief/current'

/** Condensed wordmark: first word, then the rest in safety orange. */
export default function TxBrand() {
  const [first, ...rest] = site.shortName.split(' ')
  return (
    <>
      {first}
      {rest.length > 0 && <span style={{ color: 'var(--tx-orange)' }}> {rest.join(' ')}</span>}
    </>
  )
}
