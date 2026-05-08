interface PopitDimension {
  letter: string
  name: string
  description: string
}

interface PopitGridProps {
  dimensions: PopitDimension[]
}

export default function PopitGrid({ dimensions }: PopitGridProps) {
  return (
    <div className="popit-grid">
      {dimensions.map((d, i) => (
        <div key={i} className="popit-cell">
          <div style={{
            fontFamily: 'var(--serif)',
            fontSize: 48,
            lineHeight: 1,
            color: 'var(--teal)',
            marginBottom: 16,
          }}>
            {d.letter}
          </div>
          <h4 style={{ fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{d.name}</h4>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{d.description}</p>
        </div>
      ))}
      <style>{`
        .popit-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1px;
          background: var(--hairline);
          border: 1px solid var(--hairline);
          border-radius: var(--r-2);
          overflow: hidden;
        }
        .popit-cell {
          background: var(--surface);
          padding: 28px 20px;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 900px) {
          .popit-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .popit-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
