import { type ReactNode } from 'react'

interface ButtonProps {
  variant: 'primary' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg'
  arrow?: boolean
  href?: string
  onClick?: () => void
  children: ReactNode
  type?: 'button' | 'submit'
  disabled?: boolean
}

export default function Button({
  variant,
  size,
  arrow = false,
  href,
  onClick,
  children,
  type = 'button',
  disabled,
}: ButtonProps) {
  const cls = `btn btn-${variant}${size ? ` btn-${size}` : ''}`

  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
        {arrow && <span className="arr">→</span>}
      </a>
    )
  }

  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {children}
      {arrow && <span className="arr">→</span>}
    </button>
  )
}
