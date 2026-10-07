import type { ReactNode } from 'react'
import type { SiteBadge } from '../brief/site-content'

/**
 * Line marks for credentials and places: plain inline SVG in currentColor,
 * no third-party logos, so each variant colours them in its own palette.
 * All are decorative; the text next to them carries the meaning.
 */

interface IconProps {
  className?: string
}

function Svg({ className = '', children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

/** Shield, for a BBB rating. */
export function ShieldIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.75 4.75 5.6v5.65c0 4.55 3.05 8.4 7.25 9.95 4.2-1.55 7.25-5.4 7.25-9.95V5.6L12 2.75Z" />
      <path d="m8.9 11.9 2.2 2.2 4.1-4.3" />
    </Svg>
  )
}

/** Notched seal with a check, for a license. */
export function SealIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.6l2.15 1.55 2.6-.2.85 2.5 2.25 1.35-.6 2.55L20.4 12l-1.15 2.65.6 2.55-2.25 1.35-.85 2.5-2.6-.2L12 21.4l-2.15-1.55-2.6.2-.85-2.5-2.25-1.35.6-2.55L3.6 12l1.15-2.65-.6-2.55L6.4 5.45l.85-2.5 2.6.2L12 2.6Z" />
      <path d="m8.75 12.1 2.25 2.25 4.25-4.5" />
    </Svg>
  )
}

/** Rosette with tails, for an award. */
export function RibbonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="9" r="5.75" />
      <path d="M8.4 13.4 7 21.25l5-2.75 5 2.75-1.4-7.85" />
    </Svg>
  )
}

/** Five-point star, for a review rating. */
export function StarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.9l2.75 5.6 6.15.9-4.45 4.35 1.05 6.1L12 16.95l-5.5 2.9 1.05-6.1L3.1 9.4l6.15-.9L12 2.9Z" />
    </Svg>
  )
}

/** Circle with a check, for a dealer, association or other credential. */
export function CheckCircleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.75" />
      <path d="m8.4 12.2 2.45 2.45 4.75-5" />
    </Svg>
  )
}

/** Map pin, for a town served. */
export function PinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21.25s-6.75-5.75-6.75-11.4a6.75 6.75 0 0 1 13.5 0c0 5.65-6.75 11.4-6.75 11.4Z" />
      <circle cx="12" cy="9.75" r="2.5" />
    </Svg>
  )
}

/** The mark for one badge kind. */
export function BadgeIcon({ kind, className }: IconProps & { kind: SiteBadge['kind'] }) {
  switch (kind) {
    case 'bbb':
      return <ShieldIcon className={className} />
    case 'license':
      return <SealIcon className={className} />
    case 'award':
      return <RibbonIcon className={className} />
    case 'rating':
      return <StarIcon className={className} />
    default:
      return <CheckCircleIcon className={className} />
  }
}
