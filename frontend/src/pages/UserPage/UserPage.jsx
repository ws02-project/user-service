import { useAuthContext } from "@asgardeo/auth-react"
import { Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { apiService } from "../../services/api"
import './UserPage.css'

function UserPage() {
  const { state, signOut, getAccessToken } = useAuthContext()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Redirect to login if not authenticated
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await getAccessToken()
        const data = await apiService.getPrivate(token)
        setUserData(data)
      } catch (err) {
        setError(err.response?.data?.message || err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [getAccessToken])

  return (
    <div className="user-page">
      <div className="page-title-banner">
        <h1 className="page-title">User Page</h1>
        <p className="page-subtitle">Standard User Dashboard</p>
      </div>
      <div className="user-container">
        <div className="user-header">
          <h1>👤 User Dashboard</h1>
          <button onClick={() => signOut()} className="logout-btn">
            Sign Out
          </button>
        </div>

        <div className="welcome-section">
          <h2>Welcome, {state.username || 'User'}! 👋</h2>
          <p className="user-role">Role: <span className="badge badge-user">User</span></p>
        </div>

        <div className="info-cards">
          <div className="info-card">
            <h3>📊 Your Profile</h3>
            <div className="profile-info">
              <div className="info-row">
                <span className="label">Username:</span>
                <span className="value">{state.username || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="label">Email:</span>
                <span className="value">{state.email || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="label">Status:</span>
                <span className="value status-active">Active</span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h3>🔐 Authentication Info</h3>
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="error-text">Error: {error}</p>
            ) : userData ? (
              <div className="auth-info">
                <p><strong>Token Type:</strong> JWT</p>
                <p><strong>Provider:</strong> Asgardeo</p>
                <p><strong>Authentication:</strong> OAuth 2.0</p>
                <div className="token-preview">
                  <strong>User Data:</strong>
                  <pre>{JSON.stringify(userData, null, 2)}</pre>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="features-section">
          <h3>✨ Available Features</h3>
          <div className="feature-grid">
            <div className="feature-card">
              <span className="feature-emoji">📝</span>
              <h4>View Profile</h4>
              <p>Access your personal information</p>
            </div>
            <div className="feature-card">
              <span className="feature-emoji">🔒</span>
              <h4>Secure Access</h4>
              <p>Protected with JWT tokens</p>
            </div>
            <div className="feature-card">
              <span className="feature-emoji">📊</span>
              <h4>User Data</h4>
              <p>View your user-specific data</p>
            </div>
            <div className="feature-card disabled">
              <span className="feature-emoji">⚙️</span>
              <h4>Admin Panel</h4>
              <p>Requires Admin role</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserPage
