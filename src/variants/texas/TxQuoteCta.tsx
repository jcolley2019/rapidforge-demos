import { content } from '../../content/content'
import Reveal from './Reveal'

export default function TxQuoteCta() {
  return (
    <section id="contact" style={{ background: 'var(--tx-black)', color: 'var(--tx-paper)' }}>
      <div className="tx-container tx-section">
        <Reveal>
          <h2 className="tx-display" style={{ fontSize: 'var(--tx-t6)', fontWeight: 700 }}>
            Get it surveyed{' '}
            <span className="block" style={{ color: 'var(--tx-orange)' }}>
              right.
            </span>
          </h2>
        </Reveal>
        <Reveal>
          <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <p className="max-w-md" style={{ color: 'var(--tx-steel-on-dark)' }}>
              Send your property details to{' '}
              <a
                href={`mailto:${content.contact.quoteEmail}`}
                className="font-semibold underline-offset-4 hover:underline"
                style={{ color: 'var(--tx-paper)' }}
              >
                {content.contact.quoteEmail}
              </a>{' '}
              and a Registered Professional Land Surveyor will scope your quote.
            </p>
            <div className="flex flex-col items-start gap-5">
              <a href={`mailto:${content.contact.quoteEmail}`} className="tx-btn tx-btn-orange">
                Request a Quote
              </a>
              <a
                href={content.contact.phoneHref}
                className="tx-display tx-num tx-hot-link"
                style={{ fontSize: 'var(--tx-t4)' }}
              >
                {content.contact.phone}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
