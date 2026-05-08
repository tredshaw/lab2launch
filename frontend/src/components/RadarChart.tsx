import { useScrollFill } from '../hooks/useScrollFill'

interface ScoreItem {
  label: string
  value: number
  outOf: number
}

interface RadarChartProps {
  scores: ScoreItem[]
  size?: number
  animateOnScroll?: boolean
  lowestThreshold?: number
}

export default function RadarChart({
  scores,
  size = 320,
  animateOnScroll = true,
  lowestThreshold = 2,
}: RadarChartProps) {
  const ref = useScrollFill(0.3)
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 52
  const n = scores.length
  const angle = (i: number) => -Math.PI / 2 + (Math.PI * 2 * i) / n

  const point = (val: number, outOf: number, i: number): [number, number] => {
    const ratio = val / outOf
    return [cx + Math.cos(angle(i)) * r * ratio, cy + Math.sin(angle(i)) * r * ratio]
  }

  const labelPoint = (i: number): [number, number] => {
    const lr = r + 26
    return [cx + Math.cos(angle(i)) * lr, cy + Math.sin(angle(i)) * lr]
  }

  const ringPoints = (ratio: number) =>
    scores.map((_, i) => {
      const x = cx + Math.cos(angle(i)) * r * ratio
      const y = cy + Math.sin(angle(i)) * r * ratio
      return `${x},${y}`
    }).join(' ')

  const dataPoints = scores.map((s, i) => point(s.value, s.outOf, i))
  const polyStr = dataPoints.map(p => p.join(',')).join(' ')
  const lowestIdx = scores.reduce((min, s, i) => s.value < scores[min].value ? i : min, 0)

  return (
    <div
      ref={animateOnScroll ? (ref as React.RefObject<HTMLDivElement>) : undefined}
      className="radar-svg-wrap"
      style={{ display: 'flex', justifyContent: 'center', padding: '0 40px' }}
    >
      <style>{`
        .radar-svg-wrap .radar-area {
          opacity: 0;
          transform-origin: ${cx}px ${cy}px;
          transform: scale(0.3);
          transition: opacity 1s ease, transform 1s ease;
        }
        .radar-svg-wrap.in-view .radar-area {
          opacity: 1;
          transform: scale(1);
        }
        ${scores.map((_, i) => `
          .radar-svg-wrap .radar-dot-${i} {
            opacity: 0;
            transition: opacity 0.3s ease ${0.6 + i * 0.1}s;
          }
          .radar-svg-wrap.in-view .radar-dot-${i} {
            opacity: 1;
          }
        `).join('')}
      `}</style>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} overflow="visible">
        {[0.25, 0.5, 0.75, 1].map(ratio => (
          <polygon
            key={ratio}
            points={ringPoints(ratio)}
            fill="none"
            stroke="var(--hairline)"
            strokeWidth="1"
          />
        ))}
        {scores.map((_, i) => {
          const [x, y] = point(scores[i].outOf, scores[i].outOf, i)
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--hairline)" strokeWidth="1" />
        })}
        <polygon
          className="radar-area"
          points={polyStr}
          fill="var(--signal)"
          fillOpacity="0.15"
          stroke="var(--ink)"
          strokeWidth="1.5"
        />
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            className={`radar-dot-${i}`}
            cx={p[0]}
            cy={p[1]}
            r="5"
            fill={scores[i].value <= lowestThreshold ? 'var(--coral)' : 'var(--ink)'}
            stroke="var(--bg)"
            strokeWidth="2"
          />
        ))}
        {scores.map((s, i) => {
          const [x, y] = labelPoint(i)
          const a = angle(i)
          const anchor = Math.abs(Math.cos(a)) < 0.2 ? 'middle' : (Math.cos(a) > 0 ? 'start' : 'end')
          const isLowest = i === lowestIdx
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontFamily="var(--mono)"
              fontSize="10"
              letterSpacing="1.2"
              fill={isLowest ? 'var(--coral)' : 'var(--muted)'}
            >
              {s.label}
            </text>
          )
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fontFamily="var(--mono)" fontSize="9" letterSpacing="1.5" fill="var(--muted)">Σ</text>
      </svg>
    </div>
  )
}
