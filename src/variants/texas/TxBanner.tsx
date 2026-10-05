import { content } from '../../content/content'
import Reveal from './Reveal'

export default function TxBanner() {
  const crews = content.stats.find((s) => s.label.includes('field crews'))
  const gnss = content.stats.find((s) => s.label.includes('GNSS'))
  const cad = content.stats.find((s) => s.label.includes('AutoCAD'))
  return (
    <section className="tx-on-orange" style={{ background: 'var(--tx-orange)', color: 'var(--tx-black)' }}>
      <div className="tx-container py-14">
        <Reveal>
          <p className="tx-display tx-num" style={{ fontSize: 'var(--tx-t3)', lineHeight: 1.25 }}>
            {crews?.value} two-man field crews &middot; {gnss?.value} GNSS systems on the Texas
            State Plane &middot; {cad?.value} AutoCAD drafting technicians &middot; every survey
            sealed by a licensed RPLS
          </p>
        </Reveal>
      </div>
    </section>
  )
}
