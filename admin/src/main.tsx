import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './globals.css'
import App from './App.tsx'

// Apply saved theme before React renders to prevent flash
const saved = localStorage.getItem('admin_theme') ?? 'dark'
document.documentElement.classList.toggle('dark', saved === 'dark')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
