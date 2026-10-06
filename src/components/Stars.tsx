const STAR = 'M10 1.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.8l-5.2 2.7 1-5.8L1.6 7.6l5.8-.8z'

/**
 * Five-star row for a review rating, each star filled to its exact share of
 * the rating, so 4.7 reads as four and most of a fifth rather than five.
 * Stars take the surrounding font size and colour. Renders nothing for a
 * null rating.
 */
export default function Stars({
  rating,
  className = '',
}: {
  rating: number | null
  className?: string
}) {
  if (rating === null) return null
  const value = Math.max(0, Math.min(5, rating))
  return (
    <span
      className={`inline-flex gap-[0.12em] ${className}`}
      style={{ verticalAlign: '-0.125em' }}
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i))
        return (
          <svg key={i} viewBox="0 0 20 20" width="1em" height="1em" aria-hidden="true">
            <path d={STAR} fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
            {fill > 0 && (
              <svg width={20 * fill} height="20" viewBox={`0 0 ${20 * fill} 20`}>
                <path d={STAR} fill="currentColor" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
              </svg>
            )}
          </svg>
        )
      })}
    </span>
  )
}
