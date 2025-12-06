# Asgardeo User Authentication Demo

A full-stack application demonstrating OAuth 2.0 authentication using **Asgardeo** with React frontend and Express.js backend, featuring role-based access control (RBAC).

## 🎯 Project Goals

1. ✅ **Evaluate feasibility** of using Asgardeo (Free/Sample Plan) for authentication
2. ✅ **Integrate Asgardeo** with React and Node.js
3. ✅ **Implement RBAC** (Role-Based Access Control) for users
4. ✅ **Share authentication** between microservices using JWT token propagation

## 🏗️ Architecture

```
┌─────────────────┐         JWT Token          ┌──────────────────┐
│  React Frontend │ ──────────────────────────> │ Express Backend  │
│  (Port 3000)    │ <────────────────────────── │  (Port 8080)     │
└─────────────────┘         JSON Response       └──────────────────┘
         │                                               │
         │                                               │
         └───────────────────┐       ┌──────────────────┘
                             │       │
                             ▼       ▼
                      ┌────────────────────┐
                      │  Asgardeo OAuth    │
                      │  Identity Provider │
                      └────────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React** (with Vite)
- **React Router** v6
- **@asgardeo/auth-react** SDK
- **Axios** - HTTP client for API requests
- Running on `http://localhost:3000`

### Backend
- **Express.js**
- **express-jwt** - JWT validation middleware
- **jwks-rsa** - RSA key validation
- **CORS** enabled
- Running on `http://localhost:8080`

### Authentication
- **Asgardeo** OAuth 2.0 / OpenID Connect
- JWT tokens with RS256 algorithm
- Role-based access control

## 📋 API Endpoints

| Endpoint | Auth Required | Role Required | Description |
|----------|--------------|---------------|-------------|
| `GET /api/public` | ❌ No | - | Public endpoint, accessible to anyone |
| `GET /api/private` | ✅ Yes | - | Protected endpoint, requires valid JWT |
| `GET /api/admin` | ✅ Yes | Admin | Admin-only endpoint, requires JWT + Admin role |

## 🔧 Configuration

### Asgardeo Settings
- **Organization:** testforfinalproject
- **Client ID:** KYE72a5xuVRatXXeIq5StkpRQ0a
- **Base URL:** https://api.asgardeo.io/t/testforfinalproject
- **JWKS URI:** https://api.asgardeo.io/t/testforfinalproject/oauth2/jwks
- **Issuer:** https://api.asgardeo.io/t/testforfinalproject/oauth2/token
- **Scopes:** openid, profile, email, groups, roles

### Allowed Redirect URLs (Configure in Asgardeo)
- `http://localhost:3000`

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Asgardeo account (free tier)

### Installation

1. **Clone the repository**
   ```bash
   cd https://github.com/ws02-project/user-service.git
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

You need to run both servers simultaneously:

#### Terminal 1 - Backend
```bash
cd backend
npm start
```
Backend will start on `http://localhost:8080`

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
Frontend will start on `http://localhost:3000`

## 🧪 Testing the Application

1. **Open your browser** and navigate to `http://localhost:3000`

2. **Test Public Endpoint**
   - Click "Call Public Route" button
   - Should work without authentication

3. **Sign In**
   - Click "Sign In with Asgardeo"
   - You'll be redirected to Asgardeo login page
   - Enter your credentials
   - After successful login, you'll be redirected back

4. **Test Private Endpoint**
   - After signing in, click "Call Private Route"
   - Should return user information from JWT token

5. **Test Admin Endpoint**
   - Click "Call Admin Route"
   - Will succeed only if your user has "Admin" role
   - Otherwise returns 403 Forbidden

## 🔐 Role-Based Access Control (RBAC)

The backend validates roles from the JWT token:

```javascript
const checkRole = (role) => {
  return (req, res, next) => {
    const roles = req.auth.roles || []
    if (roles.includes(role)) {
      next() // User has the role
    } else {
      res.status(403).json({ message: "Forbidden: Requires admin role" })
    }
  }
}
```

### Configuring Roles in Asgardeo
1. Go to Asgardeo Console → Users
2. Select a user
3. Assign roles (e.g., Admin, Manager, User)
4. Roles will be included in the JWT token

## 🔄 Microservice Authentication (JWT Token Propagation)

**Best Practice:** Zero Trust Model

```
┌─────────┐    JWT     ┌───────────┐    JWT     ┌───────────┐
│ React   │ ────────> │ Service A │ ────────> │ Service B │
│  App    │            │ (Express) │            │ (Any API) │
└─────────┘            └───────────┘            └───────────┘
                            │                        │
                            └────── Validate ────────┘
                                   with JWKS
```

Each microservice:
1. Receives JWT from the calling service
2. Validates the JWT independently using JWKS
3. Checks roles/permissions
4. Passes the same JWT to downstream services

## 📁 Project Structure

```
user-auth-demo/
├── backend/
│   ├── server.js           # Express server with JWT validation
│   ├── package.json        # Backend dependencies
│   └── .env.example        # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── App.css         # Styles
│   │   └── main.jsx        # Entry point with Asgardeo provider
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite configuration (port 3000)
└── README.md               # This file
```

## 🔍 Key Features Implemented

### ✅ Task 1: Evaluate Feasibility
- **Verdict:** YES - Asgardeo Free Plan is suitable
- 7,500 Monthly Active Users limit
- 5 Roles limit (sufficient for testing)
- JWT tokens supported

### ✅ Task 2: React & Node.js Integration
- Frontend uses `@asgardeo/auth-react` SDK
- Backend uses `express-jwt` + `jwks-rsa`
- Seamless OAuth 2.0 flow

### ✅ Task 3: RBAC Implementation
- Role information included in JWT
- Backend middleware checks roles
- Different endpoints for different permission levels

### ✅ Task 4: Microservice Authentication
- JWT token propagation pattern
- Each service validates independently
- No shared secrets, only public JWKS

## 🐛 Troubleshooting

### CORS Issues
Make sure backend has CORS enabled:
```javascript
app.use(cors())
```

### Token Validation Fails
1. Check JWKS URI is correct
2. Verify audience matches Client ID
3. Ensure issuer URL is correct

### Roles Not Working
1. Verify roles are assigned in Asgardeo
2. Check scope includes "roles" or "groups"
3. Inspect JWT token to see if roles are present

## 📚 Additional Resources

- [Asgardeo Documentation](https://wso2.com/asgardeo/docs/)
- [@asgardeo/auth-react SDK](https://github.com/asgardeo/asgardeo-auth-react-sdk)
- [Express.js JWT Documentation](https://github.com/auth0/express-jwt)
- [JWKS RSA](https://github.com/auth0/node-jwks-rsa)

## 📝 License

This is a demo project for learning purposes.

## 👥 Contributors

Built as a demonstration of Asgardeo OAuth integration.
