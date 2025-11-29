import { Routes, Route, Navigate } from "react-router-dom"
import { useAuthContext } from "@asgardeo/auth-react"
import { useState, useEffect } from "react"
import Login from "./pages/Login/Login"
import UserPage from "./pages/UserPage/UserPage"
import AdminPage from "./pages/AdminPage/AdminPage"
import ProtectedRoute from "./components/ProtectedRoute"
import './App.css'

function App() {
  const { state, getDecodedIDToken } = useAuthContext()
  const [userRole, setUserRole] = useState(null)
  const [isCheckingRole, setIsCheckingRole] = useState(true)

  // Get user role from decoded token
  useEffect(() => {
    const checkUserRole = async () => {
      if (state.isAuthenticated) {
        try {
          
          // Check for admin role
          const roles = idToken?.roles || []
          const userRoles = typeof roles === 'string' ? roles.split(',').map(r => r.trim()) : roles
          const isAdmin = userRoles.some(role => role.toLowerCase() === 'admin')
          
          setUserRole(isAdmin ? 'admin' : 'user')
        } catch (error) {
          console.error('Error getting decoded token:', error)
          setUserRole('user') // Default to user on error
        }
      }
      setIsCheckingRole(false)
    }

    checkUserRole()
  }, [state.isAuthenticated, getDecodedIDToken])

  // Root route - redirect based on authentication and role
  const RootRedirect = () => {
    if (!state.isAuthenticated) {
      return <Navigate to="/login" replace />
    }
    
    if (isCheckingRole) {
      return <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '1.2rem'
      }}>
        Loading...
      </div>
    }
    
    // Redirect based on role
    console.log('🔀 Redirecting user with role:', userRole)
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />
    } else {
      return <Navigate to="/user" replace />
    }
  }

  return (
    <div className="app">
      <Routes>
        {/* Root - redirects to login or dashboard based on auth */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* Login page */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected User page */}
        <Route 
          path="/user" 
          element={
            <ProtectedRoute>
              <UserPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Admin page */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
