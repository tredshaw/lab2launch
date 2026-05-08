interface SigmaSymbolProps {
  size?: number
  color?: string
  stroke?: number
}

export default function SigmaSymbol({ size = 32, color, stroke = 2.4 }: SigmaSymbolProps) {
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
        d="M5 4 H27 L18 16 L27 28 H5"
        stroke={c}
        strokeWidth={stroke}
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
    </svg>
  )
}
