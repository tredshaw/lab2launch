import WhoCard from '../components/WhoCard'
import { landing } from '../content/landing'

export default function WhoSection() {
  const { who } = landing

  return (
    <section className="section" style={{ borderBottom: '1px solid var(--hairline)' }}>
      <div className="container">
        <div style={{ marginBottom: 48 }}>
          <span className="t-mono" style={{ display: 'block', marginBottom: 8 }}>{who.number} / {who.label}</span>
          <h2 className="t-h2" style={{ marginBottom: 16 }}>
            {who.titlePre}<em>{who.titleEm}</em>
          </h2>
        </div>
        <div className="who-grid">
          {who.audiences.map((a, i) => (
            <WhoCard
              key={i}
              role={a.role}
              tag={a.tag}
              tagVariant={a.tagVariant}
              description={a.description}
              features={a.features}
            />
          ))}
        </div>
      </div>
      <style>{`
        .who-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 900px) {
          .who-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
