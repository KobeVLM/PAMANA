import axios from 'axios'

const rawUrl = import.meta.env.VITE_API_URL || ''
const cleanUrl = rawUrl.replace(/\/+$/, '')
const baseURL = cleanUrl ? (cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`) : '/api'

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('pamana_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      sessionStorage.removeItem('pamana_token')
      sessionStorage.removeItem('pamana_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
