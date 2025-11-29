import { useAuthContext } from "@asgardeo/auth-react"
import { Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { apiService } from "../../services/api"
import './AdminPage.css'

function AdminPage() {
  const { state, signOut, getAccessToken } = useAuthContext()
  const [adminData, setAdminData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasAdminRole, setHasAdminRole] = useState(false)

  // Redirect to login if not authenticated
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = await getAccessToken()
        const data = await apiService.getAdmin(token)
        setAdminData(data)
        setHasAdminRole(true)
      } catch (err) {
        if (err.response?.status === 403) {
          setHasAdminRole(false)
          setError("Access Denied: Admin role required")
        } else {
          setError(err.response?.data?.message || err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [getAccessToken])

  // If user doesn't have admin role, show access denied
  if (!loading && !hasAdminRole) {
    return (
      <div className="admin-page">
        <div className="admin-container">
          <div className="access-denied">
            <span className="denied-icon">🚫</span>
            <h1>Access Denied</h1>
            <p>You don't have permission to access this page.</p>
            <p className="error-detail">{error}</p>
            <div className="denied-actions">
              <button onClick={() => window.history.back()} className="back-btn">
                Go Back
              </button>
              <button onClick={() => signOut()} className="logout-btn">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <h1>👑 Admin Dashboard</h1>
          <button onClick={() => signOut()} className="logout-btn">
            Sign Out
          </button>
        </div>

        <div className="welcome-section admin-welcome">
          <h2>Welcome, Administrator! 👋</h2>
          <p className="admin-role">Role: <span className="badge badge-admin">Admin</span></p>
        </div>

        {loading ? (
          <div className="loading-section">
            <div className="spinner"></div>
            <p>Loading admin data...</p>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>Total Users</h3>
                  <p className="stat-number">1,234</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔐</div>
                <div className="stat-content">
                  <h3>Active Sessions</h3>
                  <p className="stat-number">89</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>API Calls</h3>
                  <p className="stat-number">45,678</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-content">
                  <h3>System Status</h3>
                  <p className="stat-number status-ok">Healthy</p>
                </div>
              </div>
            </div>

            <div className="admin-content">
              <div className="content-card">
                <h3>📋 Admin Information</h3>
                <div className="admin-info">
                  <div className="info-row">
                    <span className="label">Username:</span>
                    <span className="value">{adminData?.username || state.username || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Email:</span>
                    <span className="value">{adminData?.email || state.email || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">User ID:</span>
                    <span className="value">{adminData?.user || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Roles:</span>
                    <span className="value">
                      {adminData?.roles ? (
                        Array.isArray(adminData.roles) 
                          ? adminData.roles.join(', ') 
                          : adminData.roles
                      ) : 'N/A'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Access Level:</span>
                    <span className="value">Full Administrator</span>
                  </div>
                </div>
              </div>

              <div className="content-card">
                <h3>🔐 Token Information</h3>
                {adminData && (
                  <div className="token-info">
                    <div className="token-preview">
                      <strong>Admin Data Response:</strong>
                      <pre>{JSON.stringify(adminData, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-actions">
              <h3>⚙️ Admin Actions</h3>
              <div className="action-grid">
                <button className="action-btn btn-primary">
                  <span className="action-icon">👥</span>
                  Manage Users
                </button>
                <button className="action-btn btn-secondary">
                  <span className="action-icon">🔑</span>
                  Manage Roles
                </button>
                <button className="action-btn btn-info">
                  <span className="action-icon">📊</span>
                  View Analytics
                </button>
                <button className="action-btn btn-warning">
                  <span className="action-icon">⚙️</span>
                  System Settings
                </button>
                <button className="action-btn btn-success">
                  <span className="action-icon">📝</span>
                  View Logs
                </button>
                <button className="action-btn btn-danger">
                  <span className="action-icon">🔒</span>
                  Security Settings
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminPage
