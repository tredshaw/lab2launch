import Tag from './Tag'

interface TickerItem {
  variant: 'signal' | 'teal' | 'amber' | 'coral' | 'muted' | string
  dot?: boolean
  text: string
}

interface TickerProps {
  items: TickerItem[]
  speed?: number
}

export default function Ticker({ items, speed = 60 }: TickerProps) {
  const doubled = [...items, ...items]

  return (
    <div
      className="ticker-wrap"
      style={{
        overflow: 'hidden',
        borderBottom: '1px solid var(--hairline)',
        background: 'var(--ink)',
      }}
    >
      <div
        className="ticker-inner"
        style={{
          display: 'flex',
          gap: 32,
          padding: '10px 0',
          width: 'max-content',
          animation: `ticker-scroll ${speed}s linear infinite`,
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
          >
            {item.variant === 'muted' ? (
              <span className="t-mono" style={{ color: 'var(--muted)' }}>{item.text}</span>
            ) : (
              <Tag variant={item.variant as 'signal' | 'teal' | 'amber' | 'coral' | ''} dot={item.dot}>
                {item.text}
              </Tag>
            )}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .ticker-wrap:hover .ticker-inner {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
