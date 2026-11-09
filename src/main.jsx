import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'

// Apply the saved theme before the first paint (login page included).
try {
  document.documentElement.dataset.theme = localStorage.getItem('hris_theme') || 'light'
} catch {
  document.documentElement.dataset.theme = 'light'
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
