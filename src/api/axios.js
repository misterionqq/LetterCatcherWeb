import axios from 'axios'
import { getServerUrl } from '@/utils/serverUrl.js'

const api = axios.create()

// Resolve baseURL dynamically on every request so it picks up
// changes made after the module is first imported (e.g. user
// configures the server address on the login screen).
api.interceptors.request.use((config) => {
  config.baseURL = getServerUrl() || ''
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.replace('/login')
    }
    if (error.response?.status === 429) {
      error.rateLimited = true
    }
    return Promise.reject(error)
  }
)

export default api
