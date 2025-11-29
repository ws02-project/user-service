# Role-Based Access Control (RBAC) Guide

This guide explains how Role-Based Access Control (RBAC) is implemented in this Asgardeo authentication demo.

## Table of Contents
- [What is RBAC?](#what-is-rbac)
- [How It Works](#how-it-works)
- [Implementation Details](#implementation-details)
- [Setup in Asgardeo](#setup-in-asgardeo)
- [Backend Implementation](#backend-implementation)
- [Frontend Implementation](#frontend-implementation)
- [Testing RBAC](#testing-rbac)
- [Common Issues](#common-issues)

---

## What is RBAC?

**Role-Based Access Control (RBAC)** is a security model that restricts system access based on user roles. Instead of granting permissions to individual users, you assign users to roles, and roles have specific permissions.

### Benefits:
- 🔒 **Security**: Users only access what they need
- 👥 **Scalability**: Easy to manage permissions for many users
- 🎯 **Clarity**: Clear separation of responsibilities
- ⚡ **Efficiency**: Quick permission updates by role

### Example Scenario:
```
User: admin@demo.com
Role: admin
Permissions: 
  ✅ Access /api/public
  ✅ Access /api/private
  ✅ Access /api/admin

User: user@demo.com
Role: user
Permissions:
  ✅ Access /api/public
  ✅ Access /api/private
  ❌ Access /api/admin (403 Forbidden)
```

---

## How It Works

### Flow Diagram:
```
1. User logs in via Asgardeo
2. Asgardeo issues JWT token with user's roles
3. Frontend sends JWT to backend
4. Backend validates JWT
5. Backend checks if user has required role
6. Backend grants/denies access based on role
```

### Token Structure:
Your JWT token from Asgardeo contains:
```json
{
  "sub": "4e0fb0e3-7e35-4abe-b3ee-6938e5009787",
  "username": "admin@demo.com",
  "email": "admin@demo.com",
  "roles": "admin",  // ← Role information
  "given_name": "gethma",
  "family_name": "pasqual",
  "scope": "email groups openid profile roles"
}
```

**Important Note**: Asgardeo returns `roles` as a **string**, not an array. Our implementation handles both formats.

---

## Implementation Details

### 1. Three Levels of Access

| Level | Authentication | Role Required | Endpoint |
|-------|---------------|---------------|----------|
| **Public** | ❌ None | None | `/api/public` |
| **Private** | ✅ JWT Token | Any authenticated user | `/api/private` |
| **Admin** | ✅ JWT Token | `admin` role | `/api/admin` |

### 2. Middleware Chain

```javascript
// Public - No middleware
app.get('/api/public', handler)

// Private - JWT check only
app.get('/api/private', checkJwt, handler)

// Admin - JWT check + Role check
app.get('/api/admin', checkJwt, checkRole('admin'), handler)
```

---

## Setup in Asgardeo

### Step 1: Create Roles

1. Log in to [Asgardeo Console](https://console.asgardeo.io/)
2. Navigate to **User Management** → **Roles**
3. Click **New Role**
4. Create role: `admin`
5. Create role: `user` (optional)

### Step 2: Assign Roles to Users

1. Go to **User Management** → **Users**
2. Select a user
3. Click **Roles** tab
4. Assign role: `admin` or `user`
5. Save changes

### Step 3: Configure Application Scopes

1. Go to **Applications** → Select your app
2. Click **User Attributes** tab
3. Enable these scopes:
   - ✅ `openid`
   - ✅ `email`
   - ✅ `groups`
   - ✅ `profile`
   - ✅ `roles` ← **Critical for RBAC**
4. Save

### Step 4: Verify Token Contains Roles

Test by logging in and checking the token:
```javascript
// In browser console after login
const token = localStorage.getItem('access_token');
// Decode at https://jwt.io
// Check for "roles" field
```

---

## Backend Implementation

### File: `backend/server.js`

#### 1. JWT Validation Middleware
```javascript
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksUri: "https://api.asgardeo.io/t/testforfinalproject/oauth2/jwks"
  }),
  audience: "KYEfJzks5uXRratlXxNpS9dvpRQa",
  issuer: "https://api.asgardeo.io/t/testforfinalproject/oauth2/token",
  algorithms: ["RS256"]
});
```

**What it does**: Verifies JWT signature and expiration

#### 2. Role Check Middleware
```javascript
const checkRole = (role) => {
  return (req, res, next) => {
    // Handle both string and array formats
    let roles = req.auth.roles || [];
    
    // Convert string to array if needed
    if (typeof roles === 'string') {
      roles = roles.split(',').map(r => r.trim());
    }

    // Case-insensitive role check
    const hasRole = roles.some(r => r.toLowerCase() === role.toLowerCase());
    
    if (hasRole) {
      next(); // User has role, proceed
    } else {
      res.status(403).json({ 
        message: `Forbidden: Requires ${role} role`,
        yourRoles: roles,
        requiredRole: role
      });
    }
  };
};
```

**Key Features**:
- Handles both string and array formats for roles
- Case-insensitive comparison
- Returns clear error message with current roles

#### 3. Protected Admin Endpoint
```javascript
app.get('/api/admin', checkJwt, checkRole('admin'), (req, res) => {
  // Normalize roles to array for response
  let roles = req.auth.roles || [];
  if (typeof roles === 'string') {
    roles = roles.split(',').map(r => r.trim());
  }
  
  res.json({ 
    message: "This is an ADMIN-ONLY endpoint. Welcome, admin!",
    user: req.auth.sub,
    username: req.auth.username,
    email: req.auth.email,
    roles: roles,
    tokenData: req.auth
  });
});
```

---

## Frontend Implementation

### File: `frontend/src/pages/AdminPage/AdminPage.jsx`

#### 1. Authentication Check
```javascript
// Redirect to login if not authenticated
if (!state.isAuthenticated) {
  return <Navigate to="/login" replace />
}
```

#### 2. Role Verification via API Call
```javascript
useEffect(() => {
  const fetchAdminData = async () => {
    try {
      const token = await getAccessToken()
      const data = await apiService.getAdmin(token)
      setAdminData(data)
      setHasAdminRole(true)  // Success = has admin role
    } catch (err) {
      if (err.response?.status === 403) {
        setHasAdminRole(false)  // 403 = no admin role
        setError("Access Denied: Admin role required")
      }
    } finally {
      setLoading(false)
    }
  }

  fetchAdminData()
}, [getAccessToken])
```

**How it works**:
1. Calls `/api/admin` with JWT token
2. Backend validates token AND checks for admin role
3. If 403 error: User doesn't have admin role → Show "Access Denied"
4. If 200 success: User has admin role → Show admin dashboard

#### 3. Access Denied UI
```javascript
if (!loading && !hasAdminRole) {
  return (
    <div className="access-denied">
      <span className="denied-icon">🚫</span>
      <h1>Access Denied</h1>
      <p>You don't have permission to access this page.</p>
      <p className="error-detail">{error}</p>
      <div className="denied-actions">
        <button onClick={() => window.history.back()}>Go Back</button>
        <button onClick={() => signOut()}>Sign Out</button>
      </div>
    </div>
  )
}
```

### File: `frontend/src/components/ProtectedRoute/index.jsx`

```javascript
function ProtectedRoute({ children }) {
  const { state } = useAuthContext()

  if (state.isLoading) {
    return <div>Loading...</div>
  }

  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
```

**What it does**: Ensures user is authenticated before rendering protected pages

---

## Testing RBAC

### Test Case 1: Public Access (No Auth Required)
```bash
curl http://localhost:8080/api/public
```

**Expected**: 200 OK for everyone

### Test Case 2: Private Access (Auth Required)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8080/api/private
```

**Expected**: 
- ✅ 200 OK with valid token
- ❌ 401 Unauthorized without token

### Test Case 3: Admin Access (Auth + Admin Role)

#### Admin User:
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
     http://localhost:8080/api/admin
```

**Expected**: 
```json
{
  "message": "This is an ADMIN-ONLY endpoint. Welcome, admin!",
  "username": "admin@demo.com",
  "roles": ["admin"]
}
```

#### Regular User:
```bash
curl -H "Authorization: Bearer USER_TOKEN" \
     http://localhost:8080/api/admin
```

**Expected**: 
```json
{
  "message": "Forbidden: Requires admin role",
  "yourRoles": ["user"],
  "requiredRole": "admin"
}
```

### Frontend Testing

1. **Test as Admin User:**
   - Login with admin account
   - Navigate to http://localhost:3000/admin
   - Should see admin dashboard

2. **Test as Regular User:**
   - Login with regular user account
   - Navigate to http://localhost:3000/admin
   - Should see "Access Denied" message

---

## Common Issues

### Issue 1: Roles Not in Token

**Problem**: Token doesn't contain `roles` field

**Solution**:
1. Check Asgardeo application scopes include `roles`
2. Ensure user has role assigned in Asgardeo
3. Re-login to get fresh token

**Verify**:
```javascript
// In browser console
const token = await getAccessToken();
// Decode at jwt.io and check for "roles" field
```

### Issue 2: Always Getting 403 Forbidden

**Problem**: Admin user gets 403 on `/api/admin`

**Possible Causes**:

1. **Role name mismatch**:
   - Asgardeo role: `Admin` (uppercase)
   - Backend expects: `admin` (lowercase)
   - **Solution**: Use case-insensitive comparison (already implemented)

2. **Role format issue**:
   - Token has: `"roles": "admin"` (string)
   - Code expects: `["admin"]` (array)
   - **Solution**: Convert string to array (already implemented)

3. **Role not assigned**:
   - User doesn't have admin role in Asgardeo
   - **Solution**: Assign role in Asgardeo console

### Issue 3: Token Doesn't Update After Role Change

**Problem**: Changed role in Asgardeo but still getting old permissions

**Solution**:
```javascript
// Force logout and re-login
signOut()
// Then login again to get fresh token with new roles
```

### Issue 4: Multiple Roles

**Problem**: User has multiple roles: `"admin,user,moderator"`

**Current Implementation**: ✅ Already handles this!
```javascript
// Converts "admin,user,moderator" to ["admin", "user", "moderator"]
if (typeof roles === 'string') {
  roles = roles.split(',').map(r => r.trim());
}
```

---

## Advanced: Custom Role Checks

### Creating Additional Roles

1. **Add in Asgardeo**: Create role like `moderator`, `editor`, etc.

2. **Create Backend Endpoint**:
```javascript
app.get('/api/moderator', checkJwt, checkRole('moderator'), (req, res) => {
  res.json({ message: "Moderator access granted!" });
});
```

3. **Create Frontend Page**:
```javascript
function ModeratorPage() {
  // Same pattern as AdminPage
  const { state, getAccessToken } = useAuthContext();
  
  useEffect(() => {
    const fetchModeratorData = async () => {
      const token = await getAccessToken();
      const data = await apiService.getModerator(token); // Add to api service
      // Handle response
    };
    fetchModeratorData();
  }, []);
  
  // Render moderator dashboard
}
```

### Multiple Role Requirements

Check if user has ANY of multiple roles:
```javascript
const checkAnyRole = (roles) => {
  return (req, res, next) => {
    let userRoles = req.auth.roles || [];
    if (typeof userRoles === 'string') {
      userRoles = userRoles.split(',').map(r => r.trim());
    }
    
    const hasAnyRole = roles.some(role => 
      userRoles.some(r => r.toLowerCase() === role.toLowerCase())
    );
    
    if (hasAnyRole) {
      next();
    } else {
      res.status(403).json({ 
        message: `Forbidden: Requires one of: ${roles.join(', ')}`,
        yourRoles: userRoles 
      });
    }
  };
};

// Usage
app.get('/api/staff', checkJwt, checkAnyRole(['admin', 'moderator']), handler);
```

---

## Security Best Practices

### 1. Always Validate on Backend
❌ **Never** rely only on frontend role checks
✅ **Always** validate roles on backend

```javascript
// ❌ BAD - Frontend only
if (user.role === 'admin') {
  showAdminButton();  // Can be bypassed in browser
}

// ✅ GOOD - Backend validation
app.get('/api/admin', checkJwt, checkRole('admin'), handler);
```

### 2. Use HTTPS in Production
```javascript
// In production
const config = {
  baseUrl: "https://api.asgardeo.io/t/yourorg",  // HTTPS
  signInRedirectURL: "https://yourapp.com",       // HTTPS
}
```

### 3. Token Expiration
Tokens expire after 1 hour by default. Handle expired tokens:
```javascript
// In API service
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 4. Least Privilege Principle
- Start users with minimal permissions
- Only grant admin role when necessary
- Regularly review role assignments

---

## Summary

✅ **RBAC Implemented**: Backend validates roles in JWT tokens
✅ **Flexible**: Handles both string and array role formats
✅ **Secure**: Backend validation prevents bypassing
✅ **User-Friendly**: Clear "Access Denied" messages
✅ **Scalable**: Easy to add new roles and permissions

### Quick Reference

| Component | Purpose | File |
|-----------|---------|------|
| JWT Validation | Verify token authenticity | `backend/server.js` - `checkJwt` |
| Role Check | Verify user has required role | `backend/server.js` - `checkRole` |
| Protected Route | Ensure authentication | `frontend/src/components/ProtectedRoute` |
| Admin Page | Role-based UI access | `frontend/src/pages/AdminPage` |
| API Service | Make authenticated requests | `frontend/src/services/api` |

---

**Last Updated**: November 16, 2025
