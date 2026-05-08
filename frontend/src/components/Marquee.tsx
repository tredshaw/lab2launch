interface MarqueeProps {
  label: string
  institutions: string[]
}

export default function Marquee({ label, institutions }: MarqueeProps) {
  const doubled = [...institutions, ...institutions]

  return (
    <div style={{ padding: '32px 0', borderBottom: '1px solid var(--hairline)', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 64,
        maxWidth: 1280, margin: '0 auto', padding: '0 32px',
        fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: 'var(--muted)',
      }}>
        <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{
            display: 'flex', gap: 48,
            width: 'max-content',
            animation: 'marquee-scroll 40s linear infinite',
          }}>
            {doubled.map((name, i) => (
              <span key={i} style={{ whiteSpace: 'nowrap' }}>{name}</span>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
