# API Testing Guide

This guide provides comprehensive instructions for testing the Asgardeo authentication API endpoints.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Starting the Servers](#starting-the-servers)
- [API Endpoints](#api-endpoints)
- [Testing with cURL](#testing-with-curl)
- [Testing with Postman](#testing-with-postman)
- [Testing with Browser](#testing-with-browser)
- [Common Issues](#common-issues)

---

## Prerequisites

Before testing, ensure you have:
- Node.js installed (v14 or higher)
- Backend and frontend dependencies installed
- Asgardeo account with configured application
- Valid Client ID: `KYEfJzks5uXRratlXxNpS9dvpRQa`

---

## Starting the Servers

### 1. Start Backend Server (Port 8080)

```bash
cd backend
npm start
```

Expected output:
```
✅ Express server listening on http://localhost:8080
📋 Available endpoints:
   - GET /api/public (No auth required)
   - GET /api/private (JWT required)
   - GET /api/admin (JWT + Admin role required)
```

### 2. Start Frontend Server (Port 3000)

```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v... ready in ...ms
➜  Local:   http://localhost:3000/
```

---

## API Endpoints

### Base URL
```
http://localhost:8080/api
```

### Endpoint Summary

| Endpoint | Method | Auth Required | Role Required | Description |
|----------|--------|---------------|---------------|-------------|
| `/api/public` | GET | ❌ No | None | Publicly accessible |
| `/api/private` | GET | ✅ Yes (JWT) | None | Authenticated users only |
| `/api/admin` | GET | ✅ Yes (JWT) | Admin | Admin role required |

---

## Testing with cURL

### 1. Test Public Endpoint (No Authentication)

```bash
curl http://localhost:8080/api/public
```

**Expected Response:**
```json
{
  "message": "This is a public endpoint. Anyone can see this.",
  "timestamp": "2025-11-16T..."
}
```

---

### 2. Test Private Endpoint (Requires JWT)

#### Step 1: Get Access Token

1. Open browser: http://localhost:3000
2. Click "Sign In with Asgardeo"
3. Login with your credentials
4. Open browser DevTools (F12) → Console
5. Type: `localStorage.getItem('access_token')`
6. Copy the token value

#### Step 2: Make Request with Token

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
     http://localhost:8080/api/private
```

**Expected Response (Success):**
```json
{
  "message": "This is a private endpoint. You are logged in!",
  "user": "username@example.com",
  "tokenData": {
    "sub": "...",
    "email": "...",
    "roles": [...]
  }
}
```

**Expected Response (No Token/Invalid Token):**
```json
{
  "error": "Invalid token or unauthorized",
  "message": "..."
}
```

---

### 3. Test Admin Endpoint (Requires JWT + Admin Role)

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
     http://localhost:8080/api/admin
```

**Expected Response (Admin User):**
```json
{
  "message": "This is an ADMIN-ONLY endpoint. Welcome, admin!",
  "user": "admin@example.com",
  "roles": ["Admin"],
  "tokenData": {
    "sub": "...",
    "roles": ["Admin"]
  }
}
```

**Expected Response (Non-Admin User):**
```json
{
  "message": "Forbidden: Requires admin role",
  "yourRoles": ["User"]
}
```

---

## Testing with Postman

### Setup

1. **Create New Request**
   - Method: `GET`
   - URL: `http://localhost:8080/api/private`

2. **Add Authorization Header**
   - Go to "Headers" tab
   - Add header:
     - Key: `Authorization`
     - Value: `Bearer YOUR_ACCESS_TOKEN_HERE`

### Test Cases

#### Test Case 1: Public Endpoint
- **URL:** `http://localhost:8080/api/public`
- **Method:** GET
- **Headers:** None required
- **Expected Status:** 200 OK

#### Test Case 2: Private Endpoint (Valid Token)
- **URL:** `http://localhost:8080/api/private`
- **Method:** GET
- **Headers:** `Authorization: Bearer <valid_token>`
- **Expected Status:** 200 OK

#### Test Case 3: Private Endpoint (No Token)
- **URL:** `http://localhost:8080/api/private`
- **Method:** GET
- **Headers:** None
- **Expected Status:** 401 Unauthorized

#### Test Case 4: Admin Endpoint (Admin User)
- **URL:** `http://localhost:8080/api/admin`
- **Method:** GET
- **Headers:** `Authorization: Bearer <admin_token>`
- **Expected Status:** 200 OK
- **Expected Body:** Contains `"roles": ["Admin"]`

#### Test Case 5: Admin Endpoint (Regular User)
- **URL:** `http://localhost:8080/api/admin`
- **Method:** GET
- **Headers:** `Authorization: Bearer <user_token>`
- **Expected Status:** 403 Forbidden
- **Expected Body:** Contains `"message": "Forbidden: Requires admin role"`

---

## Testing with Browser

### Using Frontend Application

1. **Start both servers** (backend and frontend)

2. **Open Application**
   ```
   http://localhost:3000
   ```

3. **Test Public Access**
   - HomePage should load without authentication
   - Public data should be visible

4. **Test Authentication Flow**
   - Click "Sign In with Asgardeo"
   - Login with Asgardeo credentials
   - Should redirect back to app
   - Should see user dashboard at `/user`

5. **Test User Dashboard**
   - Navigate to: http://localhost:3000/user
   - Should display user profile information
   - Fetches data from `/api/private` endpoint

6. **Test Admin Dashboard**
   - Navigate to: http://localhost:3000/admin
   - **Admin User:** Should see admin dashboard
   - **Regular User:** Should see "Access Denied" message

### Using Browser DevTools

1. **Open DevTools** (F12 or right-click → Inspect)

2. **Console Method**
   ```javascript
   // Get access token
   const token = localStorage.getItem('access_token');
   console.log('Token:', token);

   // Test API call
   fetch('http://localhost:8080/api/private', {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   })
   .then(res => res.json())
   .then(data => console.log('Response:', data));
   ```

3. **Network Tab**
   - Click "Network" tab
   - Perform actions in app (login, navigate pages)
   - View API requests:
     - Request headers (Authorization header with Bearer token)
     - Response status codes (200, 401, 403)
     - Response data

---

## Common Issues

### Issue 1: CORS Error
**Error:** `Access to fetch at 'http://localhost:8080/api/...' has been blocked by CORS policy`

**Solution:**
- Ensure backend has CORS enabled (check `server.js`)
- Verify both servers are running
- Check that frontend is accessing correct backend URL

### Issue 2: 401 Unauthorized
**Error:** `Invalid token or unauthorized`

**Possible Causes:**
1. **No token provided**
   - Solution: Login through frontend first
   
2. **Token expired**
   - Solution: Re-login to get fresh token
   
3. **Invalid token format**
   - Solution: Ensure Bearer token format: `Bearer <token>`

### Issue 3: 403 Forbidden
**Error:** `Forbidden: Requires admin role`

**Possible Causes:**
1. **User doesn't have Admin role**
   - Solution: Assign Admin role in Asgardeo console
   
2. **Roles not included in token**
   - Solution: Add `roles` scope in Asgardeo application settings
   - Ensure frontend requests `roles` scope: `["openid", "email", "groups", "profile", "roles"]`

### Issue 4: Backend Not Running
**Error:** `Failed to fetch` or `net::ERR_CONNECTION_REFUSED`

**Solution:**
```bash
# Check if backend is running
ps aux | grep "node.*server.js"

# Start backend
cd backend
npm start
```

### Issue 5: Token Not Found in LocalStorage
**Issue:** `localStorage.getItem('access_token')` returns `null`

**Solution:**
1. Check Asgardeo SDK storage location:
   ```javascript
   // In browser console
   console.log(localStorage);
   console.log(sessionStorage);
   ```
2. The token might be stored under a different key by @asgardeo/auth-react
3. Use the SDK's `getAccessToken()` method instead:
   ```javascript
   // In UserPage or AdminPage component
   const { getAccessToken } = useAuthContext();
   const token = await getAccessToken();
   ```

---

## Testing Checklist

- [ ] Backend server running on port 8080
- [ ] Frontend server running on port 3000
- [ ] Public endpoint accessible without auth
- [ ] Private endpoint requires valid JWT token
- [ ] Admin endpoint requires JWT + Admin role
- [ ] Login flow redirects to Asgardeo
- [ ] Login flow redirects back to app after success
- [ ] User dashboard displays profile data
- [ ] Admin dashboard shows for admin users only
- [ ] Non-admin users see "Access Denied" on admin page
- [ ] Token includes `roles` scope
- [ ] CORS headers allow frontend to call backend

---

## Advanced Testing

### Testing Role-Based Access Control (RBAC)

1. **Create Test Users in Asgardeo:**
   - User 1: Regular user (no Admin role)
   - User 2: Admin user (with Admin role)

2. **Test Matrix:**

| User Type | Endpoint | Expected Result |
|-----------|----------|-----------------|
| Anonymous | /api/public | ✅ 200 OK |
| Anonymous | /api/private | ❌ 401 Unauthorized |
| Anonymous | /api/admin | ❌ 401 Unauthorized |
| Regular User | /api/public | ✅ 200 OK |
| Regular User | /api/private | ✅ 200 OK |
| Regular User | /api/admin | ❌ 403 Forbidden |
| Admin User | /api/public | ✅ 200 OK |
| Admin User | /api/private | ✅ 200 OK |
| Admin User | /api/admin | ✅ 200 OK |

### Testing Token Expiration

1. Login and get token
2. Wait for token expiration (default: 1 hour)
3. Try to access `/api/private`
4. Should receive 401 error
5. Re-login to get fresh token

---

## Support

For issues or questions:
- Check [Common Issues](#common-issues) section
- Review Asgardeo documentation: https://wso2.com/asgardeo/docs/
- Check browser console for errors
- Check backend terminal for server logs

---

**Last Updated:** November 16, 2025
