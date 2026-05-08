interface WordmarkProps {
  size?: 'lg' | 'md' | 'sm'
  className?: string
}

export default function Wordmark({ size = 'md', className = '' }: WordmarkProps) {
  return (
    <span className={`wm wm-${size} ${className}`} aria-label="Lab2Launch">
      Lab<span className="two">²</span>Launch
    </span>
  )
}
