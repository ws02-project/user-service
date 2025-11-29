import axios from 'axios'

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add token to all requests
apiClient.interceptors.request.use(
  (config) => {
    // Token will be added per request in the component
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data)
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error: No response from server')
    } else {
      // Something else happened
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)

// API service methods
export const apiService = {
  // Get public data (no auth required)
  getPublic: async () => {
    const response = await apiClient.get('/public')
    return response.data
  },

  // Get private data (auth required)
  getPrivate: async (token) => {
    const response = await apiClient.get('/private', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },

  // Get admin data (auth + admin role required)
  getAdmin: async (token) => {
    const response = await apiClient.get('/admin', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },

  // Generic method for any endpoint
  get: async (endpoint, token = null) => {
    const config = token ? {
      headers: {
        Authorization: `Bearer ${token}`
      }
    } : {}
    
    const response = await apiClient.get(endpoint, config)
    return response.data
  }
}

export default apiClient
