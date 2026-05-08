import Tag from './Tag'

interface WhoCardProps {
  role: string
  tag: string
  tagVariant: 'signal' | 'teal' | 'amber' | 'coral' | ''
  description: string
  features: string[]
}

export default function WhoCard({ role, tag, tagVariant, description, features }: WhoCardProps) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--hairline)',
      borderRadius: 'var(--r-3)',
      padding: 32,
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 26, lineHeight: 1.1 }}>{role}</h3>
        <Tag variant={tagVariant} dot>{tag}</Tag>
      </div>
      <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65 }}>{description}</p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14 }}>
            <span style={{ color: 'var(--signal-ink)', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>+</span>
            <span style={{ color: 'var(--ink-2)' }}>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
