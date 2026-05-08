import Tag from '../components/Tag'
import Button from '../components/Button'
import RadarChart from '../components/RadarChart'
import { landing } from '../content/landing'

export default function Hero() {
  const { hero } = landing

  return (
    <section className="hero" style={{ padding: '120px 32px 96px', borderBottom: '1px solid var(--hairline)' }}>
      <div className="hero-inner">
        <div>
          <div className="hero-eyebrow">
            <div className="hero-eyebrow-line" />
            <Tag variant={hero.eyebrow.variant} dot>{hero.eyebrow.tag}</Tag>
          </div>
          <h1 className="t-display" style={{ marginBottom: 24 }}>
            {hero.titlePre}<em>{hero.titleEm}</em>{hero.titlePost}
          </h1>
          <p className="t-lead" style={{ maxWidth: 560, marginBottom: 40 }}>{hero.lede}</p>
          <div className="hero-cta">
            <Button variant="primary" size="lg" href={hero.primaryCta.href} arrow>
              {hero.primaryCta.label}
            </Button>
            <Button variant="ghost" size="lg" href={hero.secondaryCta.href}>
              {hero.secondaryCta.label}
            </Button>
          </div>
        </div>
        <div className="hero-side">
          <div className="hero-meta">
            {hero.meta.map(m => (
              <div key={m.label} className="hero-meta-row">
                <span className="t-mono">{m.label}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginTop: 4 }}>{m.value}</span>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 32,
            padding: 24,
            background: 'var(--surface)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--r-3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
              <span className="t-mono">Readiness score</span>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 40, lineHeight: 1, color: 'var(--ink)' }}>
                {hero.sampleScore.total}<span style={{ fontSize: 20, color: 'var(--muted)' }}>/{hero.sampleScore.outOf}</span>
              </span>
            </div>
            <p className="t-small" style={{ marginBottom: 16, fontStyle: 'italic' }}>{hero.sampleScore.summary}</p>
            <RadarChart scores={hero.sampleScore.scores} size={260} lowestThreshold={2} />
          </div>
        </div>
      </div>
      <style>{`
        .hero-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 64px;
          align-items: end;
        }
        .hero-eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
        }
        .hero-eyebrow-line {
          flex: 0 0 48px;
          height: 1px;
          background: var(--hairline-2);
        }
        .hero-meta { display: flex; flex-direction: column; gap: 0; }
        .hero-meta-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-bottom: 16px;
          padding-top: 16px;
          border-bottom: 1px solid var(--hairline);
        }
        .hero-meta-row:last-child { border-bottom: none; }
        .hero-cta { display: flex; gap: 12px; flex-wrap: wrap; }
        @media (max-width: 900px) {
          .hero-inner { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
