import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { VoiceProvider } from './context/VoiceContext.jsx'
import './i18n/i18n';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <VoiceProvider>
        <Router>
          <App />
        </Router>
      </VoiceProvider>
    </AuthProvider>
  </StrictMode>,
)
