# Authentication Flow Guide

## Overview
This application implements role-based authentication with automatic routing based on user roles.

## Login Flow

### 1. Initial Access
```
User visits: http://localhost:3000
↓
App checks authentication
↓
NOT authenticated → Redirect to /login
```

### 2. Login Page
```
User clicks "Sign In with Asgardeo"
↓
Redirects to Asgardeo login portal
↓
User enters credentials
↓
Asgardeo validates and issues JWT token
↓
Redirects back to app with token
```

### 3. Role-Based Routing
```
User authenticated successfully
↓
App checks token for roles
↓
┌─────────────────────┬─────────────────────┐
│   Has "admin" role  │   No "admin" role   │
│          ↓          │          ↓          │
│  Redirect to /admin │  Redirect to /user  │
└─────────────────────┴─────────────────────┘
```

## User Roles

### Admin User
**Token Data:**
```json
{
  "roles": "admin",
  "email": "admin@demo.com",
  "username": "admin@demo.com",
  "given_name": "gethma",
  "family_name": "pasqual"
}
```

**Access:**
- ✅ /api/public
- ✅ /api/private
- ✅ /api/admin
- ✅ Admin Page (Gold/Yellow theme)
- ✅ User Page (can manually navigate)

**Landing Page:** `/admin` (Gold/Yellow dashboard)

---

### Regular User
**Token Data:**
```json
{
  "roles": "user",  // or no roles field
  "email": "user@demo.com",
  "username": "user@demo.com"
}
```

**Access:**
- ✅ /api/public
- ✅ /api/private
- ❌ /api/admin (403 Forbidden)
- ✅ User Page (Blue/Cyan theme)
- ❌ Admin Page (Access Denied message)

**Landing Page:** `/user` (Blue/Cyan dashboard)

## Visual Differences

### Admin Page (Gold Theme)
- **Background:** Dark blue/purple gradient
- **Banner:** Gold/Yellow gradient
- **Page Title:** "Admin Page" / "Administrator Control Panel"
- **Color Scheme:** 
  - Primary: Gold (#ffd700)
  - Accent: Yellow (#ffed4e)
  - Background: Dark (#1a1a2e)
- **Badge:** Gold badge with "Admin" label
- **Features:**
  - Full system stats
  - Admin actions (Manage Users, Roles, Settings)
  - Complete token information
  - Administrative controls

### User Page (Blue Theme)
- **Background:** Bright blue gradient (#00c6ff to #0072ff)
- **Banner:** Cyan/Blue gradient
- **Page Title:** "User Page" / "Standard User Dashboard"
- **Color Scheme:**
  - Primary: Blue (#0072ff)
  - Accent: Cyan (#00f2fe)
  - Background: Blue gradient
- **Badge:** White/transparent badge with "User" label
- **Features:**
  - User profile information
  - Authentication details
  - User-specific features
  - Limited admin panel (disabled)

## Routes

| Route | Access | Redirects To |
|-------|--------|--------------|
| `/` | Anyone | `/login` (not auth) or role-based (auth) |
| `/login` | Anyone | Role-based page after login |
| `/user` | Authenticated | User Dashboard |
| `/admin` | Authenticated + Admin role | Admin Dashboard |
| Any other | Anyone | `/` (root) |

## Code Logic

### App.jsx - Root Redirect
```javascript
const RootRedirect = () => {
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  // Check for admin role
  const roles = state.roles || []
  const userRoles = typeof roles === 'string' 
    ? roles.split(',').map(r => r.trim()) 
    : roles
  const isAdmin = userRoles.some(role => 
    role.toLowerCase() === 'admin'
  )
  
  // Route based on role
  if (isAdmin) {
    return <Navigate to="/admin" replace />
  } else {
    return <Navigate to="/user" replace />
  }
}
```

### Login.jsx - Post-Login Redirect
```javascript
// After successful Asgardeo login
if (state.isAuthenticated) {
  return <Navigate to="/" replace />  // Goes to root, which routes by role
}
```

### Backend - Role Check
```javascript
const checkRole = (role) => {
  return (req, res, next) => {
    let roles = req.auth.roles || []
    
    // Convert string to array
    if (typeof roles === 'string') {
      roles = roles.split(',').map(r => r.trim())
    }

    // Case-insensitive check
    const hasRole = roles.some(r => 
      r.toLowerCase() === role.toLowerCase()
    )
    
    if (hasRole) {
      next()
    } else {
      res.status(403).json({ 
        message: `Forbidden: Requires ${role} role`,
        yourRoles: roles 
      })
    }
  }
}
```

## Testing

### Test Admin Flow
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Visit: http://localhost:3000
4. Login with admin account (admin@demo.com)
5. Should redirect to: `/admin` (Gold theme)
6. Verify: Can access all API endpoints

### Test User Flow
1. Logout from admin account
2. Visit: http://localhost:3000
3. Login with regular user account
4. Should redirect to: `/user` (Blue theme)
5. Try accessing: http://localhost:3000/admin
6. Should see: "Access Denied" message

## Summary

✅ **Removed:** HomePage - no longer needed
✅ **Login First:** App always starts at login page if not authenticated
✅ **Role-Based Routing:** Automatic redirect based on token roles
✅ **Visual Distinction:** 
   - Admin Page: Gold/Yellow theme
   - User Page: Blue/Cyan theme
✅ **Clear Identification:** Page title banners show "Admin Page" vs "User Page"
✅ **Secure:** Backend validates roles for API access

---

**Last Updated:** November 16, 2025
