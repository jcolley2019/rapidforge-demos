/** Five-star glyph row for a review rating. Renders nothing for a null rating. */
export default function Stars({
  rating,
  className = '',
}: {
  rating: number | null
  className?: string
}) {
  if (rating === null) return null
  const full = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <span className={className} role="img" aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(full)}
      {'☆'.repeat(5 - full)}
    </span>
  )
}
