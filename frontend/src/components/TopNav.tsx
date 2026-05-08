import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SigmaSymbol from './SigmaSymbol'
import Wordmark from './Wordmark'
import Button from './Button'

function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try { return (localStorage.getItem('l2l-theme') as 'light' | 'dark') || 'light' } catch { return 'light' }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('l2l-theme', theme) } catch { /* ignore */ }
  }, [theme])

  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
      aria-label="Toggle theme"
    >
      {theme === 'light'
        ? <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1V3M8 13V15M1 8H3M13 8H15M3.05 3.05L4.46 4.46M11.54 11.54L12.95 12.95M3.05 12.95L4.46 11.54M11.54 4.46L12.95 3.05" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4"/></svg>
        : <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M14 9.5C13.3 9.8 12.6 10 11.8 10C8.6 10 6 7.4 6 4.2C6 3.4 6.2 2.7 6.5 2C3.9 2.7 2 5.1 2 8C2 11.3 4.7 14 8 14C10.9 14 13.3 12.1 14 9.5Z" fill="currentColor"/></svg>
      }
    </button>
  )
}

export default function TopNav() {
  const location = useLocation()
  const links = [
    { to: '/', label: 'Home' },
    { to: '/analyse', label: 'For Founders' },
    { to: '/analyse', label: 'For Researchers' },
    { to: '/#about', label: 'About' },
  ]

  return (
    <nav className="site-nav">
      <div className="site-nav-inner">
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <SigmaSymbol size={22} stroke={2.6} />
          <Wordmark size="sm" />
        </Link>
        <div className="site-nav-links">
          {links.map(l => (
            <Link
              key={l.label}
              to={l.to}
              className={location.pathname === l.to ? 'active' : ''}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ThemeToggle />
          <Button variant="primary" size="sm" href="/analyse" arrow>Run an analysis</Button>
        </div>
      </div>
    </nav>
  )
}
