# 🚀 Quick Start Guide

## Prerequisites

- Node.js v18+ installed
- npm or yarn
- Asgardeo account (free tier)

## Step 1: Asgardeo Configuration

1. **Create an Application in Asgardeo Console**
   - Go to https://console.asgardeo.io
   - Navigate to Applications → New Application
   - Select "Single Page Application"
   - Name: `User Auth Demo`

2. **Configure Application Settings**
   - **Authorized redirect URLs:** 
     ```
     http://localhost:3000
     ```
   - **Allowed origins:**
     ```
     http://localhost:3000
     http://localhost:8080
     ```
   - **Access Token Type:** JWT
   - **Grant Types:** Authorization Code, Refresh Token

3. **Note Your Configuration**
   - Client ID: `KYE72a5xuVRatXXeIq5StkpRQ0a`
   - Organization: `testforfinalproject`
   - Base URL: `https://api.asgardeo.io/t/testforfinalproject`

4. **Configure Roles (Optional)**
   - Go to Roles → Create Role
   - Create roles: `Admin`, `Manager`, `User`
   - Assign roles to test users

## Step 2: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Step 3: Start the Servers

### Option 1: Manual Start (Recommended for Testing)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
✅ Backend running on http://localhost:8080

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Frontend running on http://localhost:3000

### Option 2: Using npm scripts from root

Create a `package.json` in the root directory:

```json
{
  "name": "user-auth-demo",
  "scripts": {
    "start:backend": "cd backend && npm start",
    "start:frontend": "cd frontend && npm run dev",
    "install:all": "cd backend && npm install && cd ../frontend && npm install"
  }
}
```

Then run:
```bash
npm run install:all
npm run start:backend    # Terminal 1
npm run start:frontend   # Terminal 2
```

## Step 4: Test the Application

1. **Open Browser**
   ```
   http://localhost:3000
   ```

2. **Test Public Endpoint**
   - Click "🌐 Call Public Route"
   - Should see success message without login

3. **Sign In**
   - Click "Sign In with Asgardeo"
   - Enter your Asgardeo credentials
   - You'll be redirected back after successful login

4. **Test Private Endpoint**
   - Click "🔒 Call Private Route"
   - Should see your user information

5. **Test Admin Endpoint**
   - Click "👑 Call Admin Route"
   - If you have Admin role: Success
   - If not: 403 Forbidden error

## 🔍 Verifying JWT Token

You can inspect the JWT token:

1. Open browser DevTools (F12)
2. Go to Application → Session Storage
3. Find the Asgardeo session
4. Copy the access token
5. Paste it at https://jwt.io to decode

You should see:
- `sub`: User ID
- `roles`: Array of user roles
- `aud`: Your client ID
- `iss`: Asgardeo issuer URL

## 🐛 Common Issues & Solutions

### Issue: "CORS Error"
**Solution:** Make sure backend server is running on port 8080 and has CORS enabled.

### Issue: "Invalid Token"
**Solution:** 
- Check that JWKS URI is correct in `backend/server.js`
- Verify issuer and audience match your Asgardeo config

### Issue: "Roles not found"
**Solution:**
- Ensure scope includes "roles" in `frontend/src/main.jsx`
- Assign roles to your user in Asgardeo Console
- Check token at jwt.io to verify roles are included

### Issue: Frontend not on port 3000
**Solution:** Check `frontend/vite.config.js` has:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})
```

## 📊 Architecture Flow

```
User Browser (localhost:3000)
         │
         ├─ Sign In → Asgardeo Login Page
         │
         ├─ Callback with Auth Code
         │
         ├─ Exchange Code for Token (automatic)
         │
         └─ API Call with JWT Token
                  │
                  ▼
         Express Backend (localhost:8080)
                  │
                  ├─ Validate JWT with JWKS
                  │
                  ├─ Check Roles (if required)
                  │
                  └─ Return Response
```

## 🎯 Next Steps

1. **Add More Endpoints:** Create additional protected routes
2. **Add More Roles:** Implement Manager, User roles
3. **Add Database:** Store user data in MongoDB/PostgreSQL
4. **Add Service-to-Service Auth:** Implement microservice communication
5. **Deploy:** Deploy to cloud (Vercel, Heroku, AWS)

## 📚 Useful Commands

```bash
# Check if ports are in use
lsof -i :3000
lsof -i :8080

# Kill process on port
kill -9 $(lsof -t -i:3000)
kill -9 $(lsof -t -i:8080)

# View backend logs
cd backend && npm start

# Build frontend for production
cd frontend && npm run build

# Preview production build
cd frontend && npm run preview
```

## 🔐 Security Best Practices

1. ✅ Never commit `.env` files
2. ✅ Always validate tokens on the backend
3. ✅ Use HTTPS in production
4. ✅ Implement token refresh logic
5. ✅ Set appropriate token expiry times
6. ✅ Use environment variables for sensitive data

## 📞 Support

- [Asgardeo Documentation](https://wso2.com/asgardeo/docs/)
- [Asgardeo Community](https://discord.gg/wso2)
- Check `README.md` for detailed information
