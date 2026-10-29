import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (import.meta.env.DEV && new URLSearchParams(location.search).has('demo')) {
  const { buildDemoDB } = await import('./lib/demo')
  localStorage.setItem('work-hours-ledger.v1', JSON.stringify(buildDemoDB()))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
