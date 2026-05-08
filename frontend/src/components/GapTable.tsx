interface GapRow {
  dimension: string
  pop: string
  current: string
  target: string
  priority: 'high' | 'med' | 'low'
}

interface GapTableProps {
  rows: GapRow[]
  caption?: string
}

const priorityColor = {
  high: 'var(--coral)',
  med: 'var(--amber)',
  low: 'var(--teal)',
}

const priorityBg = {
  high: 'var(--coral-soft)',
  med: 'var(--amber-soft)',
  low: 'var(--teal-soft)',
}

export default function GapTable({ rows, caption }: GapTableProps) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-3)', overflow: 'hidden' }}>
      {caption && (
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between' }}>
          <span className="t-mono">{caption}</span>
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Dimension', 'Where you are', 'Where you need to be', 'Priority'].map(h => (
                <th key={h} style={{
                  padding: '10px 16px',
                  textAlign: 'left',
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  fontWeight: 500,
                  borderBottom: '1px solid var(--hairline)',
                  background: 'var(--bg-2)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderTop: i > 0 ? '1px solid var(--hairline)' : undefined }}>
                <td style={{ padding: '14px 16px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  <span style={{
                    display: 'inline-block',
                    fontFamily: 'var(--mono)',
                    fontSize: 9,
                    fontWeight: 700,
                    color: 'var(--teal)',
                    marginRight: 8,
                    letterSpacing: '0.1em',
                  }}>
                    {row.pop}
                  </span>
                  {row.dimension.split('·')[1]?.trim() ?? row.dimension}
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--muted)', lineHeight: 1.5 }}>{row.current}</td>
                <td style={{ padding: '14px 16px', color: 'var(--ink-2)', lineHeight: 1.5 }}>{row.target}</td>
                <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: 'var(--r-1)',
                    fontFamily: 'var(--mono)',
                    fontSize: 9,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    color: priorityColor[row.priority],
                    background: priorityBg[row.priority],
                  }}>
                    {row.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
