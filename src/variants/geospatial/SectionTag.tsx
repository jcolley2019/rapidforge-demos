/** Monospace section index, e.g. "01 / SERVICES", with a hairline tail. */
export default function SectionTag({ index, label }: { index: string; label: string }) {
  return (
    <p className="g-eyebrow flex items-center gap-4">
      <span className="g-num">
        {index} / {label}
      </span>
      <span
        aria-hidden="true"
        className="g-tick-draw h-px w-16 bg-(--geo-line-strong)"
      />
    </p>
  )
}
