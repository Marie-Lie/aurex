import axios from 'axios'
import Cookies from 'js-cookie'
import { authService } from './authService'

const STORE_ID = import.meta.env.VITE_OSIMART_STORE_ID
const API_BASE = 'https://api.osimart.com'

const apiClient = axios.create({
  baseURL: `${API_BASE}/store/apis`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use(config => {
  const token = Cookies.get('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (config.params) {
    config.params.store = STORE_ID
  } else {
    config.params = { store: STORE_ID }
  }

  return config
})

apiClient.interceptors.response.use(
  response => {
    const data = response.data

    if (data && data.results && Array.isArray(data.results)) {
      data.results = data.results.map(item => {
        if (item.image?.path?.startsWith('static/')) {
          item.image.path = `${API_BASE}/${item.image.path}`
        }

        if (item.main_image?.path?.startsWith('static/')) {
          item.main_image.path = `${API_BASE}/${item.main_image.path}`
        }

        return item
      })
    }

    if (data?.image?.path?.startsWith('static/')) {
      data.image.path = `${API_BASE}/${data.image.path}`
    }

    if (data?.main_image?.path?.startsWith('static/')) {
      data.main_image.path = `${API_BASE}/${data.main_image.path}`
    }

    return response
  },

  async error => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true

      const newToken = await authService.refreshAccessToken()

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`

        return apiClient(originalRequest)
      }

      await authService.logout()
    }

    return Promise.reject(error)
  }
)

export default apiClient