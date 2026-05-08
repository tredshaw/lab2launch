import { type ReactNode } from 'react'

interface ActBullet {
  pop: string
  text: string
}

interface ActCardProps {
  letter: 'D' | 'A' | 'E'
  number: string
  title: ReactNode
  body: string
  bullets: ActBullet[]
  featured?: boolean
}

export default function ActCard({ letter, number, title, body, bullets, featured = false }: ActCardProps) {
  return (
    <div
      className={`act-card${featured ? ' act-card--featured' : ''}`}
      style={{
        background: featured ? 'var(--ink)' : 'var(--surface)',
        color: featured ? 'var(--bg)' : 'var(--ink)',
        border: featured ? 'none' : '1px solid var(--hairline)',
        borderRadius: 'var(--r-3)',
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        transform: featured ? 'translateY(-16px)' : undefined,
        boxShadow: featured ? '0 24px 48px rgba(0,0,0,0.2)' : undefined,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span
          className="t-mono"
          style={{
            color: featured ? 'var(--signal)' : 'var(--muted)',
            background: featured ? 'rgba(124,255,178,0.15)' : 'var(--bg-2)',
            padding: '4px 8px',
            borderRadius: 3,
            fontSize: 10,
          }}
        >
          {number}
        </span>
        <span style={{
          fontFamily: 'var(--serif)',
          fontSize: 64,
          lineHeight: 1,
          opacity: 0.08,
          color: featured ? 'var(--bg)' : 'var(--ink)',
        }}>
          {letter}
        </span>
      </div>
      <h3 className="t-h3" style={{ color: featured ? 'var(--bg)' : undefined }}>{title}</h3>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: featured ? 'rgba(244,241,234,0.7)' : 'var(--muted)', flex: 1 }}>{body}</p>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        paddingTop: 16,
        borderTop: `1px solid ${featured ? 'rgba(255,255,255,0.12)' : 'var(--hairline)'}`,
      }}>
        {bullets.map((b, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13 }}>
            <span style={{
              fontFamily: 'var(--mono)',
              fontSize: 9,
              fontWeight: 700,
              color: featured ? 'var(--signal)' : 'var(--teal)',
              flexShrink: 0,
              marginTop: 2,
              letterSpacing: '0.1em',
            }}>
              {b.pop}
            </span>
            <span style={{ color: featured ? 'rgba(244,241,234,0.8)' : 'var(--ink-2)', lineHeight: 1.5 }}>{b.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
