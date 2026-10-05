/**
 * Faint orbit lines — concentric ellipses that sit behind the hero text
 * and continue behind the panel. Geometry only; stroke colors come from
 * the palette.
 */
export default function ClOrbits({ stroke = '#2b5bd7', className = '' }: { stroke?: string; className?: string }) {
  const rings = [220, 330, 450, 590]
  return (
    <svg
      className={`cl-orbits ${className}`}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g className="cl-orbits-spin" fill="none" stroke={stroke} strokeOpacity="0.14" strokeWidth="1" style={{ transformBox: 'view-box' }}>
        {rings.map((r, i) => (
          <ellipse key={r} cx="980" cy="450" rx={r * 1.35} ry={r} transform={`rotate(${-18 + i * 7} 980 450)`} />
        ))}
      </g>
      <circle cx="980" cy="450" r="3" fill={stroke} fillOpacity="0.35" />
    </svg>
  )
}
