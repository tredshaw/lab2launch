import GapTable from '../components/GapTable'
import { landing } from '../content/landing'

export default function AnatomyOfGap() {
  const { anatomyOfGap } = landing

  return (
    <section className="section" style={{ borderBottom: '1px solid var(--hairline)' }}>
      <div className="container">
        <div style={{ marginBottom: 48 }}>
          <span className="t-mono" style={{ display: 'block', marginBottom: 8 }}>{anatomyOfGap.number} / {anatomyOfGap.label}</span>
          <h2 className="t-h2" style={{ marginBottom: 16 }}>
            {anatomyOfGap.titlePre}<em>{anatomyOfGap.titleEm}</em>
          </h2>
          <p className="t-body" style={{ maxWidth: 560 }}>{anatomyOfGap.description}</p>
        </div>
        <GapTable rows={anatomyOfGap.rows} caption={anatomyOfGap.caption} />
      </div>
    </section>
  )
}
