import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { useCanvasStore } from './stores/canvasStore'

if (import.meta.env.DEV) {
  // @ts-expect-error dev-only console helper
  window.__store = useCanvasStore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
