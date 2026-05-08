import PopitGrid from '../components/PopitGrid'
import { landing } from '../content/landing'

export default function PopitSection() {
  const { popit } = landing

  return (
    <section className="section" style={{ borderBottom: '1px solid var(--hairline)' }}>
      <div className="container">
        <div style={{ marginBottom: 48 }}>
          <span className="t-mono" style={{ display: 'block', marginBottom: 8 }}>{popit.number} / {popit.label}</span>
          <h2 className="t-h2" style={{ marginBottom: 16 }}>
            {popit.titlePre}<em>{popit.titleEm}</em>
          </h2>
          <p className="t-body" style={{ maxWidth: 560 }}>{popit.description}</p>
        </div>
        <PopitGrid dimensions={popit.dimensions} />
      </div>
    </section>
  )
}
