# Frontend - React + Vite with Asgardeo

## Features

- **OAuth 2.0 Login/Logout**: Using @asgardeo/auth-react SDK
- **Protected Routes**: React Router integration
- **API Integration**: Calls to backend with JWT tokens using Axios
- **Role Display**: Shows user roles from token
- **Responsive UI**: Modern, gradient-based design
- **Centralized API Service**: Clean axios-based API client

## Running the App

```bash
npm run dev
```

App will start on `http://localhost:3000`

## Building for Production

```bash
npm run build
npm run preview
```

## How Authentication Works

1. User clicks "Sign In"
2. Redirected to Asgardeo login page
3. After successful authentication, redirected back to app
4. Access token stored in session
5. Token automatically included in API requests

## API Integration Example

Using Axios for HTTP requests:

```javascript
import { apiService } from './services/api'

const token = await getAccessToken()

// Public endpoint (no auth)
const publicData = await apiService.getPublic()

// Private endpoint (auth required)
const privateData = await apiService.getPrivate(token)

// Admin endpoint (auth + role required)
const adminData = await apiService.getAdmin(token)
```

### Error Handling
```javascript
try {
  const data = await apiService.getAdmin(token)
} catch (error) {
  if (error.response) {
    // Server error (4xx, 5xx)
    console.log('Status:', error.response.status)
    console.log('Data:', error.response.data)
  } else if (error.request) {
    // No response from server
    console.log('Network error')
  } else {
    console.log('Error:', error.message)
  }
}
```

## Routes

- `/` - Home page with authentication and API testing
- `/about` - About page with project information

## Configuration

Asgardeo configuration is in `src/main.jsx`:

```javascript
const config = {
  signInRedirectURL: "http://localhost:3000",
  signOutRedirectURL: "http://localhost:3000",
  clientID: "KYE72a5xuVRatXXeIq5StkpRQ0a",
  baseUrl: "https://api.asgardeo.io/t/testforfinalproject",
  scope: ["openid", "profile", "email", "groups", "roles"]
}
```
