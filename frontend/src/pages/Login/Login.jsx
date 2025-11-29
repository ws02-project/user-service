import { useAuthContext } from "@asgardeo/auth-react"
import { Navigate } from "react-router-dom"
import './Login.css'

function Login() {
  const { state, signIn } = useAuthContext()

  // Debug logging
  console.log("Login Page - Auth State:", state)

  // If already authenticated, redirect to home
  if (state.isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSignIn = () => {
    console.log("Sign In button clicked")
    signIn()
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🔐 Welcome to Asgardeo Demo</h1>
          <p>Secure Authentication with Role-Based Access Control</p>
        </div>

        <div className="login-content">
          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>Secure OAuth 2.0 Authentication</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <span>Role-Based Access Control</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🚀</span>
              <span>JWT Token Validation</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <span>Microservice Ready</span>
            </div>
          </div>

          <button 
            onClick={handleSignIn} 
            className="login-button"
          >
            Sign In with Asgardeo
          </button>

          <div className="login-info">
            <p>By signing in, you'll be redirected to Asgardeo's secure login page.</p>
          </div>
        </div>
      </div>

      {state.isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Redirecting to Asgardeo...</p>
        </div>
      )}
    </div>
  )
}

export default Login
