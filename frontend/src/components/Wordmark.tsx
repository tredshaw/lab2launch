interface WordmarkProps {
  size?: 'lg' | 'md' | 'sm'
  className?: string
}

export default function Wordmark({ size = 'md', className = '' }: WordmarkProps) {
  return (
    <span className={`wm wm-${size} ${className}`} aria-label="Lab2Launch">
      Lab<span className="two" style={{ fontStyle: 'normal', fontSize: '0.55em', verticalAlign: 'super', letterSpacing: 0, color: 'inherit' }}>[2]</span>Launch
    </span>
  )
}
