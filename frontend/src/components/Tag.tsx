import { type ReactNode } from 'react'

interface TagProps {
  variant?: 'signal' | 'teal' | 'amber' | 'coral' | ''
  dot?: boolean
  children: ReactNode
}

export default function Tag({ variant = '', dot = false, children }: TagProps) {
  return (
    <span className={`tag${variant ? ` tag-${variant}` : ''}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  )
}
