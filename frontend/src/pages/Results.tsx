import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import TopNav from '../components/TopNav'
import RadarChart from '../components/RadarChart'
import Tag from '../components/Tag'

interface Dimension {
  score: number
  justification: string
  now: string[]
  target: string[]
  gap: string[]
  priority: 'High' | 'Medium' | 'Low'
  action: string
  framework_tags: string[]
}

interface Action {
  rank: number
  headline: string
  deliverable: string
  timeline: string
  first_step: string
  rationale: string
}

interface AnalysisResult {
  plain_english_summary: string
  assets: { asset: string; why_it_matters: string }[]
  dimensions: {
    problem_clarity: Dimension
    market_evidence: Dimension
    competitive_position: Dimension
    team_execution: Dimension
    risk_awareness: Dimension
  }
  total_score: number
  stage_label: string
  top_3_actions: Action[]
}

interface Analysis {
  id: number
  project_name: string
  created_at: string
  result: AnalysisResult
}

const DIM_LABELS: Record<string, string> = {
  problem_clarity: 'Problem',
  market_evidence: 'Market',
  competitive_position: 'Competition',
  team_execution: 'Team',
  risk_awareness: 'Risk',
}

const PRIORITY_VARIANT: Record<string, 'coral' | 'amber' | 'teal'> = {
  High: 'coral', Medium: 'amber', Low: 'teal',
}

function DimCard({ name, dim }: { name: string; dim: Dimension }) {
  return (
    <div style={{ border: '1px solid var(--hairline)', borderRadius: 'var(--r-3)', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="t-mono" style={{ display: 'block', marginBottom: 4 }}>{DIM_LABELS[name]}</span>
          <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>{dim.justification}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 24 }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 40, lineHeight: 1 }}>{dim.score}</span>
          <span className="t-mono" style={{ fontSize: 9 }}>/10</span>
          <div style={{ marginTop: 6 }}>
            <Tag variant={PRIORITY_VARIANT[dim.priority]}>{dim.priority} priority</Tag>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid var(--hairline)' }}>
        {(['now', 'target', 'gap'] as const).map((col, i) => (
          <div key={col} style={{ padding: '16px 20px', borderLeft: i > 0 ? '1px solid var(--hairline)' : undefined }}>
            <span className="t-mono" style={{ display: 'block', marginBottom: 8, fontSize: 9 }}>{col === 'now' ? 'Current state' : col === 'target' ? 'Target state' : 'The gap'}</span>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {dim[col].map((b, j) => (
                <li key={j} style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--ink-2)', display: 'flex', gap: 6 }}>
                  <span style={{ color: 'var(--muted)', flexShrink: 0 }}>·</span>{b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ padding: '16px 24px', background: 'var(--bg-2)' }}>
        <span className="t-mono" style={{ display: 'inline', marginRight: 8, fontSize: 9 }}>Action</span>
        <span style={{ fontSize: 13, color: 'var(--ink)' }}>{dim.action}</span>
      </div>
    </div>
  )
}

export default function Results() {
  const { id } = useParams<{ id: string }>()
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/analyses/${id}`)
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json() })
      .then(setAnalysis)
      .catch(e => setError(e.message))
  }, [id])

  if (error) return (
    <>
      <TopNav />
      <div style={{ maxWidth: 640, margin: '96px auto', padding: '0 32px', textAlign: 'center' }}>
        <h1 className="t-h2" style={{ marginBottom: 16 }}>Analysis not found</h1>
        <p className="t-body" style={{ marginBottom: 32 }}>Could not load analysis #{id}. The backend may not be running.</p>
        <Link to="/" className="btn btn-primary">Back to home</Link>
      </div>
    </>
  )

  if (!analysis) return (
    <>
      <TopNav />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--hairline)', borderTopColor: 'var(--signal)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  )

  const r = analysis.result
  const dimKeys = Object.keys(r.dimensions) as (keyof typeof r.dimensions)[]
  const radarScores = dimKeys.map(k => ({ label: DIM_LABELS[k], value: r.dimensions[k].score, outOf: 10 }))

  return (
    <>
      <TopNav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px 96px' }}>

        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, alignItems: 'start', marginBottom: 48, paddingBottom: 48, borderBottom: '1px solid var(--hairline)' }}>
          <div>
            <span className="t-mono" style={{ display: 'block', marginBottom: 8 }}>Gap analysis report</span>
            <h1 className="t-h2" style={{ marginBottom: 8 }}>{analysis.project_name || 'Untitled project'}</h1>
            <p className="t-body" style={{ maxWidth: 560 }}>{r.plain_english_summary}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="t-mono" style={{ display: 'block', marginBottom: 4 }}>Readiness score</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 64, lineHeight: 1 }}>{r.total_score}</span>
              <span className="t-mono">/50</span>
            </div>
            <span style={{ marginTop: 8, display: 'inline-block' }}><Tag variant="teal">{r.stage_label}</Tag></span>
          </div>
        </div>

        {/* Radar + top actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 48 }}>
          <div>
            <span className="t-mono" style={{ display: 'block', marginBottom: 16 }}>Dimension scores</span>
            <RadarChart scores={radarScores} size={300} lowestThreshold={3} />
          </div>
          <div>
            <span className="t-mono" style={{ display: 'block', marginBottom: 16 }}>Top 3 actions</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {r.top_3_actions.map((a, i) => (
                <div key={i} style={{ border: '1px solid var(--hairline)', borderRadius: 'var(--r-2)', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, background: 'var(--signal)', color: 'var(--signal-ink)', padding: '2px 6px', borderRadius: 3, flexShrink: 0 }}>{a.rank}</span>
                    <strong style={{ fontSize: 14 }}>{a.headline}</strong>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, paddingLeft: 30 }}>{a.deliverable}</p>
                  <p style={{ fontSize: 11, color: 'var(--signal-ink)', background: 'var(--signal-soft)', padding: '4px 8px', borderRadius: 3, display: 'inline-block', marginLeft: 30, fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>This week: {a.first_step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dimension cards */}
        <span className="t-mono" style={{ display: 'block', marginBottom: 16 }}>Five dimensions</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 48 }}>
          {dimKeys.map(k => <DimCard key={k} name={k} dim={r.dimensions[k]} />)}
        </div>

        {/* Assets */}
        {r.assets?.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <span className="t-mono" style={{ display: 'block', marginBottom: 16 }}>Your assets</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {r.assets.map((a, i) => (
                <div key={i} style={{ border: '1px solid var(--hairline)', borderRadius: 'var(--r-2)', padding: '16px 20px' }}>
                  <strong style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>{a.asset}</strong>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>{a.why_it_matters}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: 12, paddingTop: 32, borderTop: '1px solid var(--hairline)' }}>
          <a
            href={`/download-pdf?analysis_id=${id}`}
            className="btn btn-primary"
            onClick={async e => {
              e.preventDefault()
              const res = await fetch('/download-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysis: r, project_name: analysis.project_name || 'report' }),
              })
              const blob = await res.blob()
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = `${analysis.project_name || 'report'}.pdf`; a.click()
              URL.revokeObjectURL(url)
            }}
          >
            Download PDF →
          </a>
          <Link to="/analyse" className="btn btn-ghost">Run another analysis</Link>
          <Link to="/" className="btn btn-ghost">Home</Link>
        </div>

      </div>
      <style>{`
        @media (max-width: 900px) {
          .results-header { grid-template-columns: 1fr !important; }
          .results-mid { grid-template-columns: 1fr !important; }
          .dim-cols { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
