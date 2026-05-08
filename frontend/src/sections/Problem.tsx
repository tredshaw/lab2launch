import { landing } from '../content/landing'

export default function Problem() {
  const { problem } = landing

  return (
    <section className="section" style={{ borderBottom: '1px solid var(--hairline)' }}>
      <div className="container">
        <div className="problem-grid">
          <div>
            <div className="sec-head-col">
              <span className="t-mono" style={{ display: 'block', marginBottom: 8 }}>{problem.number} / {problem.label}</span>
              <h2 className="t-h2" style={{ marginBottom: 16 }}>
                {problem.titlePre}<em>{problem.titleEm}</em>
              </h2>
              <p className="t-body" style={{ maxWidth: 440 }}>{problem.description}</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {problem.cells.map((cell, i) => (
              <div key={i} style={{
                padding: '32px 0',
                borderTop: i === 0 ? '1px solid var(--ink)' : '1px solid var(--hairline)',
                borderBottom: i === problem.cells.length - 1 ? '1px solid var(--hairline)' : undefined,
              }}>
                <p className="t-mono" style={{ marginBottom: 12 }}>{cell.title}</p>
                <blockquote style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 22,
                  lineHeight: 1.4,
                  margin: 0,
                  marginBottom: 12,
                }}>
                  "{cell.quote}"
                </blockquote>
                <p className="t-small" style={{ fontStyle: 'italic' }}>{cell.attribution}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .problem-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .problem-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
