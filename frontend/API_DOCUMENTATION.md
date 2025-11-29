# API Service Documentation

## Overview

The frontend uses **axios** for all HTTP requests to the backend API. The API service is centralized in `src/services/api.js` for better code organization and maintainability.

## Setup

### Axios Installation
```bash
npm install axios
```

### Configuration

The axios instance is configured with:
- **Base URL:** `http://localhost:8080/api`
- **Timeout:** 10 seconds
- **Content-Type:** `application/json`

## API Service Methods

### 1. getPublic()
Fetch public data (no authentication required)

```javascript
import { apiService } from './services/api'

const data = await apiService.getPublic()
```

**Response:**
```json
{
  "message": "This is a public endpoint. Anyone can see this.",
  "timestamp": "2025-11-16T12:34:56.789Z"
}
```

---

### 2. getPrivate(token)
Fetch private data (authentication required)

```javascript
const token = await getAccessToken()
const data = await apiService.getPrivate(token)
```

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "message": "This is a private endpoint. You are logged in!",
  "user": "user@example.com",
  "tokenData": { ... }
}
```

---

### 3. getAdmin(token)
Fetch admin data (authentication + Admin role required)

```javascript
const token = await getAccessToken()
const data = await apiService.getAdmin(token)
```

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Success Response (User has Admin role):**
```json
{
  "message": "This is an ADMIN-ONLY endpoint. Welcome, admin!",
  "user": "admin@example.com",
  "roles": ["Admin"],
  "tokenData": { ... }
}
```

**Error Response (User lacks Admin role):**
```json
{
  "message": "Forbidden: Requires admin role",
  "yourRoles": ["User"]
}
```
Status: `403 Forbidden`

---

### 4. get(endpoint, token)
Generic method for any endpoint

```javascript
const data = await apiService.get('/custom-endpoint', token)
```

## Error Handling

Axios provides structured error handling:

### Server Error (4xx, 5xx)
```javascript
try {
  const data = await apiService.getAdmin(token)
} catch (error) {
  if (error.response) {
    console.log('Status:', error.response.status)
    console.log('Data:', error.response.data)
    console.log('Headers:', error.response.headers)
  }
}
```

### Network Error (No response)
```javascript
catch (error) {
  if (error.request) {
    console.log('No response received')
    console.log('Request:', error.request)
  }
}
```

### Other Errors
```javascript
catch (error) {
  console.log('Error:', error.message)
}
```

## Interceptors

### Request Interceptor
Automatically logs all outgoing requests (can be extended for adding tokens globally)

```javascript
apiClient.interceptors.request.use(
  (config) => {
    console.log('Request:', config.method.toUpperCase(), config.url)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
```

### Response Interceptor
Automatically logs errors for debugging

```javascript
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Global error logging
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data)
    }
    return Promise.reject(error)
  }
)
```

## Usage in Components

### Basic Usage
```jsx
import { apiService } from './services/api'
import { useAuthContext } from '@asgardeo/auth-react'

function MyComponent() {
  const { getAccessToken } = useAuthContext()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = await getAccessToken()
      const result = await apiService.getPrivate(token)
      setData(result)
    } catch (err) {
      setError(err.response?.data || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={fetchData}>Fetch Data</button>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {JSON.stringify(error)}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}
```

## Axios vs Fetch Comparison

| Feature | Axios | Fetch |
|---------|-------|-------|
| JSON parsing | Automatic | Manual (`res.json()`) |
| Error handling | Rejects on HTTP errors | Only rejects on network errors |
| Request/Response interceptors | ✅ Yes | ❌ No |
| Timeout support | ✅ Yes | ❌ No (native) |
| Progress tracking | ✅ Yes | Limited |
| Request cancellation | ✅ Yes | Requires AbortController |
| Browser support | ✅ Excellent | ✅ Excellent (modern) |
| Automatic transforms | ✅ Yes | ❌ No |
| Base URL config | ✅ Yes | ❌ No (native) |

## Benefits of Using Axios

1. **Automatic JSON transformation** - No need to call `.json()`
2. **Better error handling** - HTTP errors trigger catch block
3. **Request/Response interceptors** - Global handling
4. **Timeout support** - Prevent hanging requests
5. **CSRF protection** - Built-in support
6. **Request cancellation** - Easy to cancel pending requests
7. **Progress tracking** - Upload/download progress

## Advanced Features

### Request Cancellation
```javascript
import axios from 'axios'

const CancelToken = axios.CancelToken
const source = CancelToken.source()

apiService.get('/data', token, { cancelToken: source.token })
  .catch((error) => {
    if (axios.isCancel(error)) {
      console.log('Request canceled:', error.message)
    }
  })

// Cancel the request
source.cancel('Operation canceled by user')
```

### Progress Tracking
```javascript
const uploadFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post('/upload', formData, {
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      )
      console.log(`Upload Progress: ${percentCompleted}%`)
    }
  })
  
  return response.data
}
```

### Concurrent Requests
```javascript
import axios from 'axios'

const fetchAllData = async (token) => {
  try {
    const [publicData, privateData, adminData] = await axios.all([
      apiService.getPublic(),
      apiService.getPrivate(token),
      apiService.getAdmin(token)
    ])
    
    return { publicData, privateData, adminData }
  } catch (error) {
    console.error('One or more requests failed:', error)
  }
}
```

## Environment Configuration

For production, use environment variables:

```javascript
// .env
VITE_API_BASE_URL=https://api.production.com

// api.js
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000
})
```

## Testing

### Mock Axios for Testing
```javascript
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

const mock = new MockAdapter(axios)

// Mock public endpoint
mock.onGet('/public').reply(200, {
  message: 'Public data'
})

// Mock private endpoint with auth
mock.onGet('/private').reply((config) => {
  if (config.headers.Authorization) {
    return [200, { message: 'Private data' }]
  }
  return [401, { error: 'Unauthorized' }]
})
```

## Troubleshooting

### CORS Issues
If you see CORS errors:
1. Ensure backend has CORS enabled
2. Check backend is running on port 8080
3. Verify axios baseURL is correct

### Timeout Errors
```javascript
// Increase timeout for slow endpoints
const data = await apiClient.get('/slow-endpoint', {
  timeout: 30000 // 30 seconds
})
```

### Authentication Errors
If getting 401 errors:
1. Verify token is valid
2. Check token expiration
3. Ensure Authorization header format: `Bearer <token>`

---

## Summary

The axios-based API service provides:
- ✅ Clean, organized API calls
- ✅ Better error handling
- ✅ Automatic JSON parsing
- ✅ Request/Response interceptors
- ✅ Timeout support
- ✅ Easy to test and mock
- ✅ Production-ready configuration
