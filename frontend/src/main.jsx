import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from "@asgardeo/auth-react"
import { BrowserRouter } from 'react-router-dom'

// Asgardeo Configuration
const config = {
  signInRedirectURL: "http://localhost:3000",
  signOutRedirectURL: "http://localhost:3000",
  clientID: "KYEfJzks5uXRratlXxNpS9dvpRQa",
  baseUrl: "https://api.asgardeo.io/t/testforfinalproject",
  scope: ["openid", "email", "groups", "profile", "roles"],
  resourceServerURLs: ["http://localhost:8080"]
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider config={config}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
