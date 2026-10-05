import { content } from '../../content/content'

export default function AerialFooter() {
  return (
    <footer className="ae-footer" aria-label="Footer">
      <div className="ae-wrap">
        <div className="ae-footer-grid">
          <div>
            <p className="ae-footer-heading">{content.name}</p>
            <address>
              {content.contact.address}
              <br />
              <a href={content.contact.phoneHref} className="ae-link">
                {content.contact.phone}
              </a>
            </address>
          </div>
          <div>
            <p className="ae-footer-heading">Clients</p>
            <ul className="ae-footer-list">
              <li>
                <a
                  href={content.contact.clientPortal}
                  target="_blank"
                  rel="noreferrer"
                  className="ae-link"
                >
                  Client portal
                </a>
              </li>
              <li>
                <a href={`mailto:${content.contact.quoteEmail}`} className="ae-link">
                  {content.contact.quoteEmail}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="ae-footer-heading">Elsewhere</p>
            <ul className="ae-footer-list">
              <li>
                <a
                  href={content.contact.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="ae-link"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href={content.contact.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="ae-link"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="ae-footer-bottom">
          <span>
            &copy; {new Date().getFullYear()} {content.name}
          </span>
          <span>Serving {content.serviceArea}</span>
        </div>
      </div>
    </footer>
  )
}
