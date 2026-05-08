import ActCard from '../components/ActCard'
import { landing } from '../content/landing'

export default function ThreeActs() {
  const { threeActs } = landing

  return (
    <section className="section" style={{ borderBottom: '1px solid var(--hairline)' }}>
      <div className="container">
        <div style={{ marginBottom: 48 }}>
          <span className="t-mono" style={{ display: 'block', marginBottom: 8 }}>{threeActs.number} / {threeActs.label}</span>
          <h2 className="t-h2" style={{ marginBottom: 16 }}>
            {threeActs.titlePre}<em>{threeActs.titleEm}</em>
          </h2>
          <p className="t-body" style={{ maxWidth: 560 }}>{threeActs.description}</p>
        </div>
        <div className="three-acts-grid">
          {threeActs.acts.map(act => (
            <ActCard
              key={act.letter}
              letter={act.letter}
              number={act.number}
              title={act.title}
              body={act.body}
              bullets={act.bullets}
              featured={act.featured}
            />
          ))}
        </div>
      </div>
      <style>{`
        .three-acts-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .three-acts-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
