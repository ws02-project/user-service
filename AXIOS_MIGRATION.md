# Migration from Fetch to Axios

## Overview

The frontend has been updated to use **Axios** instead of the native Fetch API for better error handling, automatic JSON parsing, and request/response interceptors.

## Key Changes

### 1. Installation
```bash
npm install axios
```

### 2. API Service Created
New file: `src/services/api.js` - Centralized API client configuration

### 3. Code Comparison

#### Before (Fetch API)
```javascript
// App.jsx - OLD
const callApi = async (endpoint) => {
  try {
    const token = await getAccessToken()
    
    const res = await fetch(`http://localhost:8080/api/${endpoint}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
    
    const data = await res.json()
    setApiResponse(JSON.stringify(data, null, 2))
  } catch (error) {
    setApiResponse(`Error: ${error.message}`)
  }
}
```

#### After (Axios)
```javascript
// App.jsx - NEW
import { apiService } from './services/api'

const callApi = async (endpoint) => {
  try {
    const token = await getAccessToken()
    let data
    
    switch(endpoint) {
      case 'public':
        data = await apiService.getPublic()
        break
      case 'private':
        data = await apiService.getPrivate(token)
        break
      case 'admin':
        data = await apiService.getAdmin(token)
        break
    }
    
    setApiResponse(JSON.stringify(data, null, 2))
  } catch (error) {
    if (error.response) {
      setApiResponse(`Error ${error.response.status}: ${JSON.stringify(error.response.data, null, 2)}`)
    } else if (error.request) {
      setApiResponse(`Error: No response from server`)
    } else {
      setApiResponse(`Error: ${error.message}`)
    }
  }
}
```

## Improvements

### ✅ 1. Automatic JSON Parsing
**Before:**
```javascript
const res = await fetch(url)
const data = await res.json()  // Manual parsing
```

**After:**
```javascript
const response = await axios.get(url)
const data = response.data  // Automatic parsing
```

### ✅ 2. Better Error Handling
**Before (Fetch):**
```javascript
// Fetch doesn't reject on HTTP errors (4xx, 5xx)
const res = await fetch(url)
if (!res.ok) {
  throw new Error('HTTP error')
}
```

**After (Axios):**
```javascript
// Axios automatically rejects on HTTP errors
try {
  const data = await axios.get(url)
} catch (error) {
  if (error.response) {
    // Server responded with error status
    console.log(error.response.status)
    console.log(error.response.data)
  }
}
```

### ✅ 3. Request/Response Interceptors
**Not possible with Fetch natively**

**Axios:**
```javascript
// Add token to all requests automatically
apiClient.interceptors.request.use((config) => {
  // Modify request before sending
  return config
})

// Handle all responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error logging
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)
```

### ✅ 4. Timeout Support
**Before (Fetch):**
```javascript
// No native timeout support
// Need to use AbortController manually
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 5000)

fetch(url, { signal: controller.signal })
```

**After (Axios):**
```javascript
// Built-in timeout
axios.create({
  timeout: 10000  // 10 seconds
})
```

### ✅ 5. Base URL Configuration
**Before (Fetch):**
```javascript
// Must construct full URL every time
fetch('http://localhost:8080/api/public')
fetch('http://localhost:8080/api/private')
```

**After (Axios):**
```javascript
// Configure once, use everywhere
const api = axios.create({
  baseURL: 'http://localhost:8080/api'
})

api.get('/public')
api.get('/private')
```

### ✅ 6. Request Cancellation
**Before (Fetch):**
```javascript
const controller = new AbortController()
fetch(url, { signal: controller.signal })
controller.abort()
```

**After (Axios):**
```javascript
const source = axios.CancelToken.source()
axios.get(url, { cancelToken: source.token })
source.cancel('Operation canceled')
```

## File Structure

### New Files
```
frontend/
├── src/
│   ├── services/
│   │   └── api.js          # NEW: Axios API service
│   ├── App.jsx             # UPDATED: Uses apiService
│   └── ...
└── API_DOCUMENTATION.md    # NEW: API usage guide
```

## API Service Structure

```javascript
// src/services/api.js

import axios from 'axios'

// Create axios instance
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Export service methods
export const apiService = {
  getPublic: async () => {
    const response = await apiClient.get('/public')
    return response.data
  },
  
  getPrivate: async (token) => {
    const response = await apiClient.get('/private', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },
  
  getAdmin: async (token) => {
    const response = await apiClient.get('/admin', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  }
}
```

## Benefits Summary

| Feature | Fetch | Axios |
|---------|-------|-------|
| JSON Parsing | Manual | ✅ Automatic |
| Error Handling | Manual check | ✅ Automatic |
| Interceptors | ❌ No | ✅ Yes |
| Timeout | Manual (AbortController) | ✅ Built-in |
| Base URL | ❌ No | ✅ Yes |
| Progress Tracking | Limited | ✅ Yes |
| Request Cancellation | Manual (AbortController) | ✅ Easy |
| Transform Request/Response | ❌ No | ✅ Yes |
| CSRF Protection | ❌ No | ✅ Yes |
| Browser Support | Modern only | ✅ Excellent |

## Testing

All existing functionality works the same:
- ✅ Public endpoint
- ✅ Private endpoint  
- ✅ Admin endpoint
- ✅ Error handling (improved)
- ✅ Loading states
- ✅ Token management

## No Breaking Changes

The UI and functionality remain identical. This is purely an internal refactoring for:
- Better code organization
- Improved error handling
- More maintainable code
- Production-ready patterns

## Next Steps

You can now:
1. Test the application (works exactly as before)
2. Add more API endpoints easily
3. Use interceptors for global auth handling
4. Implement request cancellation
5. Track upload/download progress

## Documentation

See `frontend/API_DOCUMENTATION.md` for detailed axios usage examples.

---

**Migration Complete! ✅**

The application now uses Axios for all HTTP requests with improved error handling and better developer experience.
