import Button from '../components/Button'
import { landing } from '../content/landing'

export default function CTA() {
  const { cta } = landing

  return (
    <section style={{ padding: '0 32px', margin: '96px auto', maxWidth: 1280 }}>
      <div data-cta-inner className="cta-dark" style={{
        borderRadius: 'var(--r-4)',
        padding: '96px 64px',
      }}>
        <h2 className="t-h1" style={{ color: '#F4F1EA', marginBottom: 24, maxWidth: 640 }}>
          {cta.titlePre}<em style={{ color: 'rgba(244,241,234,0.45)', fontStyle: 'italic' }}>{cta.titleEm}</em>
        </h2>
        <p className="t-lead" style={{ color: 'rgba(244,241,234,0.6)', maxWidth: 520, marginBottom: 40 }}>
          {cta.body}
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <Button
            variant="primary"
            size="lg"
            href={cta.primaryCta.href}
            arrow
          >
            {cta.primaryCta.label}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            href={cta.secondaryCta.href}
          >
            {cta.secondaryCta.label}
          </Button>
        </div>
        <p className="t-mono" style={{ color: 'var(--muted)', fontSize: 11 }}>{cta.meta}</p>
      </div>
      <style>{`
        .cta-dark {
          background: #0A1320;
          --btn-primary-bg: #7CFFB2;
          --btn-primary-fg: #0B3D2E;
          --btn-primary-hover: #6CF0A2;
        }
        .cta-dark .btn-ghost {
          color: rgba(244,241,234,0.85);
          border-color: rgba(244,241,234,0.3);
        }
        .cta-dark .btn-ghost:hover {
          color: #F4F1EA;
          border-color: rgba(244,241,234,0.7);
        }
        .cta-dark .t-mono { color: rgba(244,241,234,0.35); }
        @media (max-width: 900px) {
          [data-cta-inner] { padding: 48px 32px !important; }
        }
      `}</style>
    </section>
  )
}
