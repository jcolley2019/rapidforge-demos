/** Crosshair corner ticks — place inside any relative container. */
export default function Ticks({ className = '' }: { className?: string }) {
  const base = `pointer-events-none absolute h-2.5 w-2.5 border-(--geo-line-strong) ${className}`
  return (
    <>
      <span aria-hidden="true" className={`${base} top-0 left-0 border-t border-l`} />
      <span aria-hidden="true" className={`${base} top-0 right-0 border-t border-r`} />
      <span aria-hidden="true" className={`${base} bottom-0 left-0 border-b border-l`} />
      <span aria-hidden="true" className={`${base} right-0 bottom-0 border-r border-b`} />
    </>
  )
}
