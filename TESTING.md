# 🧪 Testing Checklist

Use this checklist to verify your Asgardeo authentication implementation.

## ✅ Pre-Flight Checks

- [ ] Node.js v18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Asgardeo account created
- [ ] Application registered in Asgardeo Console
- [ ] Redirect URLs configured in Asgardeo

## ✅ Backend Setup

- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] `.env` file created (or using defaults)
- [ ] Backend starts without errors (`npm start`)
- [ ] Backend running on http://localhost:8080
- [ ] Public endpoint works: `curl http://localhost:8080/api/public`

## ✅ Frontend Setup

- [ ] Frontend dependencies installed (`cd frontend && npm install`)
- [ ] Asgardeo config in `src/main.jsx` is correct
- [ ] Frontend starts without errors (`npm run dev`)
- [ ] Frontend running on http://localhost:3000
- [ ] No console errors in browser DevTools

## ✅ Authentication Flow

- [ ] "Sign In" button is visible
- [ ] Clicking "Sign In" redirects to Asgardeo
- [ ] Can see Asgardeo login page
- [ ] Can enter credentials and login
- [ ] Redirected back to http://localhost:3000
- [ ] Username is displayed after login
- [ ] "Sign Out" button appears

## ✅ API Testing - Public Endpoint

- [ ] Click "🌐 Call Public Route" button
- [ ] Response shows success message
- [ ] Works WITHOUT being logged in

## ✅ API Testing - Private Endpoint

- [ ] Sign in first
- [ ] Click "🔒 Call Private Route" button
- [ ] Response shows user information
- [ ] Response includes token data
- [ ] Returns 401 error when NOT logged in

## ✅ API Testing - Admin Endpoint

### If you have Admin role:
- [ ] Sign in with admin user
- [ ] Click "👑 Call Admin Route" button
- [ ] Response shows admin message
- [ ] Response includes roles array with "Admin"

### If you DON'T have Admin role:
- [ ] Sign in with regular user
- [ ] Click "👑 Call Admin Route" button
- [ ] Response shows 403 Forbidden error
- [ ] Error message mentions "Requires admin role"

## ✅ Role-Based Access Control (RBAC)

### Setup in Asgardeo:
- [ ] Created "Admin" role in Asgardeo Console
- [ ] Assigned Admin role to test user
- [ ] Role appears in JWT token (check at jwt.io)
- [ ] Backend correctly validates role

### Testing:
- [ ] User with Admin role can access `/api/admin`
- [ ] User without Admin role gets 403 error
- [ ] Regular user can still access `/api/private`

## ✅ JWT Token Validation

- [ ] Open browser DevTools (F12)
- [ ] Go to Network tab
- [ ] Click "Call Private Route"
- [ ] Check request headers
- [ ] Authorization header contains `Bearer <token>`
- [ ] Copy token and paste at https://jwt.io
- [ ] Token decodes successfully
- [ ] Token contains: `aud`, `iss`, `sub`, `roles`

## ✅ Error Handling

- [ ] Invalid token returns 401 Unauthorized
- [ ] Missing token returns 401 Unauthorized
- [ ] Expired token returns 401 Unauthorized
- [ ] Insufficient role returns 403 Forbidden
- [ ] Backend errors return proper error messages

## ✅ React Router

- [ ] Navigate to http://localhost:3000/
- [ ] Home page loads
- [ ] Click "About" link in navbar
- [ ] Navigate to http://localhost:3000/about
- [ ] About page loads with project information
- [ ] Can navigate back to home

## ✅ Sign Out Flow

- [ ] Sign in first
- [ ] Click "Sign Out" button
- [ ] Username disappears
- [ ] "Sign In" button appears again
- [ ] Private/Admin buttons are disabled
- [ ] Clicking private endpoint returns 401 error

## ✅ Security Verification

- [ ] Tokens are NOT visible in URL
- [ ] Tokens stored securely (Session Storage)
- [ ] CORS is properly configured
- [ ] Backend validates every protected request
- [ ] No sensitive data in console logs

## ✅ Microservice Pattern

To test JWT propagation to another service:

- [ ] Backend receives JWT from frontend
- [ ] Backend can extract token from `req.headers.authorization`
- [ ] Backend can forward same token to another service
- [ ] Second service can independently validate the token
- [ ] No shared secrets needed (only JWKS)

## 🐛 Troubleshooting

If any checks fail, see `SETUP.md` for troubleshooting guide.

### Common Issues:

**❌ CORS Error**
```
Solution: Ensure backend has cors() enabled and is running
```

**❌ Invalid Token**
```
Solution: Check JWKS URI, audience, and issuer in server.js
```

**❌ Roles Not Found**
```
Solution: Check scope includes "roles" and assign roles in Asgardeo
```

**❌ Port Already in Use**
```
Solution: Kill existing process or change port
lsof -i :3000
lsof -i :8080
```

## 📊 Success Criteria

All 4 project tasks completed:

✅ **Task 1:** Asgardeo Free Plan is feasible
- 7,500 MAU limit
- 5 roles limit
- JWT token support

✅ **Task 2:** React & Node.js Integration
- Frontend uses @asgardeo/auth-react
- Backend uses express-jwt + jwks-rsa
- OAuth flow works end-to-end

✅ **Task 3:** RBAC Implementation
- Roles in JWT token
- Backend validates roles
- Different access levels work

✅ **Task 4:** Microservice Authentication
- JWT token propagation pattern
- Independent validation
- Zero-trust security

## 🎉 Next Steps

Once all checks pass:

1. **Explore the Code**: Understand how each component works
2. **Customize**: Add your own endpoints and roles
3. **Extend**: Add database, more services, etc.
4. **Deploy**: Deploy to production environment
5. **Monitor**: Set up logging and monitoring

---

**Happy Testing! 🚀**
