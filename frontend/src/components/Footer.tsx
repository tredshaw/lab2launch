import { Link } from 'react-router-dom'
import SigmaSymbol from './SigmaSymbol'
import Wordmark from './Wordmark'

export default function Footer() {
  return (
    <footer className="site-foot">
      <div className="site-foot-inner">
        <div>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <SigmaSymbol size={26} stroke={2.6} />
            <Wordmark size="md" />
          </Link>
          <p className="t-body" style={{ marginTop: 16, maxWidth: 320 }}>
            The readiness instrument that gets researchers from bench to balance sheet.
          </p>
        </div>
        <div>
          <h5>Product</h5>
          <ul>
            <li><Link to="/analyse">Run analysis</Link></li>
            <li><Link to="/#sample">Sample report</Link></li>
            <li><Link to="/#how">How it works</Link></li>
          </ul>
        </div>
        <div>
          <h5>For You</h5>
          <ul>
            <li><Link to="/analyse">Founders</Link></li>
            <li><Link to="/analyse">Researchers</Link></li>
            <li><Link to="/#about">About</Link></li>
          </ul>
        </div>
        <div>
          <h5>Company</h5>
          <ul>
            <li><a href="#">Manifesto</a></li>
            <li><a href="#">Contact</a></li>
            <li><a href="#">Terms · Privacy</a></li>
          </ul>
        </div>
      </div>
      <div className="site-foot-bottom">
        <span>© 2026 Lab²Launch</span>
        <span>v0.3 — Built in London</span>
      </div>
    </footer>
  )
}
