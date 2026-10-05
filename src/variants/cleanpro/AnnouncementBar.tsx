import { content } from '../../content/content'

export default function AnnouncementBar() {
  return (
    <div
      className="cp-on-blue px-4 py-2 text-center text-sm text-white"
      style={{ background: 'var(--cp-blue)' }}
    >
      Serving North Texas since <span className="cp-num">{content.founded.year}</span> —{' '}
      <a
        href={content.contact.phoneHref}
        className="cp-num font-semibold underline decoration-transparent underline-offset-4 transition-[text-decoration-color] duration-300 hover:decoration-current focus-visible:decoration-current"
      >
        {content.contact.phone}
      </a>
    </div>
  )
}
