interface DeltaSymbolProps {
  size?: number
  color?: string
  stroke?: number
}

export default function SigmaSymbol({ size = 32, color, stroke = 2.2 }: DeltaSymbolProps) {
  const c = color ?? 'var(--ink)'
  return (
    <svg
      className="sym-sigma"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16 4 L28 27 L4 27 Z"
        stroke={c}
        strokeWidth={stroke}
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
    </svg>
  )
}
