import LiveReport from '../components/LiveReport'
import { landing } from '../content/landing'

export default function LiveReportSection() {
  const { liveReport, meta } = landing

  return (
    <section className="section" style={{ borderBottom: '1px solid var(--hairline)' }}>
      <div className="container" style={{ marginBottom: 48 }}>
        <span className="t-mono" style={{ display: 'block', marginBottom: 8 }}>{liveReport.number} / {liveReport.label}</span>
        <h2 className="t-h2" style={{ marginBottom: 8 }}>
          What the report <em>actually looks like.</em>
        </h2>
        <p className="t-body" style={{ maxWidth: 560 }}>
          Scroll through the four sections. This is a real sample analysis — NovaCore Bioscaffold, {meta.version}.
        </p>
      </div>
      <LiveReport
        title={liveReport.title}
        generatedDate={liveReport.generatedDate}
        plainEnglish={liveReport.plainEnglish}
        scores={liveReport.scores}
        overall={liveReport.overall}
        actions={liveReport.actions}
        stages={liveReport.stages}
      />
    </section>
  )
}
