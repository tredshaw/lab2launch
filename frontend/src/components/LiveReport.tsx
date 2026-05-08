import { useEffect, useRef, useState } from 'react'

interface Stage {
  num: string
  title: string
  description: string
}

interface ScoreItem {
  label: string
  value: number
  outOf: number
}

interface ActionItem {
  text: string
  priority: 'high' | 'med' | 'low'
}

interface LiveReportProps {
  title: string
  generatedDate: string
  plainEnglish: string
  scores: ScoreItem[]
  overall: { value: number; outOf: number; label: string }
  actions: ActionItem[]
  stages: Stage[]
}

const priorityColor = { high: 'var(--coral)', med: 'var(--amber)', low: 'var(--teal)' }

function ScoreBar({ value, outOf }: { value: number; outOf: number }) {
  const pct = (value / outOf) * 100
  const color = value <= 4 ? 'var(--coral)' : value <= 6 ? 'var(--amber)' : 'var(--teal)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--hairline)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, minWidth: 36, textAlign: 'right' }}>
        {value}/{outOf}
      </span>
    </div>
  )
}

export default function LiveReport({
  title,
  generatedDate,
  plainEnglish,
  scores,
  overall,
  actions,
  stages,
}: LiveReportProps) {
  const [activeStage, setActiveStage] = useState(0)
  const stageRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observers = stageRefs.current.map((el, i) => {
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveStage(i) },
        { rootMargin: '-15% 0px -35% 0px', threshold: 0 },
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [])

  return (
    <div className="live-report-shell">
      {/* Left: scrollable narrative */}
      <div className="live-report-stages">
        {stages.map((stage, i) => (
          <div
            key={i}
            ref={el => { stageRefs.current[i] = el }}
            className={`live-report-stage${activeStage === i ? ' active' : ''}`}
            style={{ minHeight: '40vh', paddingBottom: 64 }}
          >
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
              <span style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.16em',
                color: activeStage === i ? 'var(--signal-ink)' : 'var(--muted)',
                background: activeStage === i ? 'var(--signal)' : 'var(--bg-2)',
                padding: '4px 8px',
                borderRadius: 3,
                flexShrink: 0,
                transition: 'all 0.3s ease',
              }}>
                {stage.num}
              </span>
            </div>
            <h3 className="t-h3" style={{
              marginBottom: 16,
              color: activeStage === i ? 'var(--ink)' : 'var(--muted)',
              transition: 'color 0.3s ease',
            }}>
              {stage.title}
            </h3>
            <p className="t-body">{stage.description}</p>
          </div>
        ))}
      </div>

      {/* Right: sticky panel */}
      <div className="live-report-card-wrap">
        <div className="live-report-card">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--hairline)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span className="t-mono">{title}</span>
              <span className="t-mono" style={{ fontSize: 9 }}>{generatedDate}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 56, lineHeight: 1 }}>{overall.value}</span>
              <span className="t-mono" style={{ color: 'var(--muted)' }}>/{overall.outOf}</span>
            </div>
            <p className="t-small" style={{ fontStyle: 'italic', marginTop: 4 }}>{overall.label}</p>
          </div>

          {/* Block 0: plain English */}
          <div
            className="report-block"
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--hairline)',
              opacity: activeStage >= 0 ? 1 : 0,
              transform: activeStage >= 0 ? 'none' : 'translateY(8px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}
          >
            <p className="t-mono" style={{ marginBottom: 8 }}>Plain English</p>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)' }}>{plainEnglish.slice(0, 160)}…</p>
          </div>

          {/* Block 1+: scores */}
          {activeStage >= 1 && (
            <div
              className="report-block"
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--hairline)',
                animation: 'fadein 0.4s ease-out both',
              }}
            >
              <p className="t-mono" style={{ marginBottom: 12 }}>Dimension scores</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {scores.map(s => (
                  <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span className="t-mono" style={{ fontSize: 9 }}>{s.label}</span>
                    <ScoreBar value={s.value} outOf={s.outOf} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Block 2+: top actions */}
          {activeStage >= 2 && (
            <div
              className="report-block"
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--hairline)',
                animation: 'fadein 0.4s ease-out both',
              }}
            >
              <p className="t-mono" style={{ marginBottom: 12 }}>Top actions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {actions.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                      animation: `fadein 0.3s ease-out ${i * 0.2}s both`,
                    }}
                  >
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: priorityColor[a.priority],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                      color: 'white', flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{a.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Block 3+: download prompt */}
          {activeStage >= 3 && (
            <div
              style={{
                padding: '20px 24px',
                animation: 'fadein 0.4s ease-out both',
              }}
            >
              <a
                href="/analyse"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Run your analysis <span className="arr">→</span>
              </a>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .live-report-shell {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 64px;
          align-items: start;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
        }
        .live-report-card-wrap {
          position: sticky;
          top: 100px;
        }
        .live-report-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: var(--r-3);
          overflow: hidden;
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: none; }
        }
        @media (max-width: 900px) {
          .live-report-shell {
            grid-template-columns: 1fr !important;
          }
          .live-report-card-wrap {
            position: static !important;
          }
        }
      `}</style>
    </div>
  )
}
