import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './tokens/tokens.css'
import App from './App'

const savedTheme = localStorage.getItem('l2l-theme')
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
