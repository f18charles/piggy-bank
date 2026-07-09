import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import { StrictMode } from 'react'
import AuthProvider from './utils/auth/AuthProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
