import axios from 'axios'
import Cookies from 'js-cookie'

const API_BASE = 'https://api.osimart.com'

const authClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

const STORE_ID = import.meta.env.VITE_OSIMART_STORE_ID

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

authClient.interceptors.request.use(config => {
  const token = Cookies.get('token')
  
  const isAuthRoute = config.url.includes('/auth/refresh') || 
                      config.url.includes('/auth/login') || 
                      config.url.includes('/auth/register');

  if (token && !isAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
}, error => {
  return Promise.reject(error)
})

authClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url.includes('/auth/refresh') &&
        !originalRequest.url.includes('/auth/login') &&
        !originalRequest.url.includes('/auth/register')) {
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return authClient(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newToken = await authService.refreshAccessToken()
        if (newToken) {
          processQueue(null, newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return authClient(originalRequest)
        } else {
          processQueue(new Error('Refresh failed'))
          if (Cookies.get('token')) {
            authService.logout()
          }
          return Promise.reject(error)
        }
      } catch (refreshError) {
        processQueue(refreshError, null)
        if (Cookies.get('token')) {
          authService.logout()
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    
    return Promise.reject(error)
  }
)

export const authService = {
  async register(userData) {
    try {
      const payload = {
        register_as: 'customer',
        store_id: STORE_ID,
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        password: userData.password,
        mobile: userData.mobile
      }
      const response = await authClient.post('/auth/register/', payload)
      
      if (response.data.token || response.data.access_token) {
        const token = response.data.token || response.data.access_token
        Cookies.set('token', token)
        localStorage.setItem('isLoggedIn', 'true')
      }
      
      return response.data
    } catch (error) {
      console.error('Registration error:', error)
      throw error.response?.data || { message: error.message }
    }
  },

  async login(credentials) {
    try {
      const payload = {
        login_as: 'customer',
        store_id: STORE_ID,
        email: credentials.email,
        password: credentials.password,
        device_name: credentials.deviceName || 'web-browser',
        device_id: credentials.deviceId || this.generateDeviceId()
      }
      
      const response = await authClient.post('/auth/login/', payload)

      if (response.data.access_token) {
        Cookies.set('token', response.data.access_token, { expires: 7 })
        Cookies.set('refresh_token', response.data.refresh_token, { expires: 7 })
        Cookies.set('session_id', response.data.session_id, { expires: 7 })
        localStorage.setItem('isLoggedIn', 'true')

        if (response.data.user?.id || response.data.id) {
          localStorage.setItem('customerId', response.data.user?.id || response.data.id)
        }

        if (response.data.user) {
          localStorage.setItem('userData', JSON.stringify(response.data.user))
        }

        return response.data
      } else {
        if (response.data && response.data.message && 
            response.data.message.toLowerCase().includes('verify')) {
          throw new Error('VERIFICATION_REQUIRED')
        }
        throw new Error('No token received from server')
      }
    } catch (error) {
      console.error('Login error:', error)
      
      if (error.response?.data?.message?.toLowerCase().includes('verify') ||
          error.response?.data?.detail?.toLowerCase().includes('verify')) {
        throw new Error('VERIFICATION_REQUIRED')
      }
      
      let errorMessage = 'Invalid email or password'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      }
      
      throw new Error(errorMessage)
    }
  },

  async getCurrentUser(explicitToken = null) {
    try {
      const token = explicitToken || Cookies.get('token')

      if (!token) {
        return null
      }

      const config = explicitToken 
        ? { headers: { Authorization: `Bearer ${explicitToken}` } }
        : {};
      
      const response = await authClient.get('/store/apis/customer-info/', config)
      
      let user = response.data
      if (Array.isArray(response.data) && response.data.length > 0) {
        user = response.data[0]
      } else if (response.data.results && Array.isArray(response.data.results) && response.data.results.length > 0) {
        user = response.data.results[0]
      }

      return user
    } catch (error) {
      return false;
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await authClient.put(
        '/store/apis/customer-info/modify/',
        profileData
      )

      return response.data
    } catch (error) {
      throw error.response?.data || {
        message: 'Failed to update profile'
      }
    }
  },

  async verifyOTP(email, code) {
    try {
      const payload = {
        verify_as: 'customer',
        code: code,
        store_id: STORE_ID,
        email: email
      }
      
      const response = await authClient.post('/auth/verify/', payload)
      
      if (response.data.access_token) {
        Cookies.set('token', response.data.access_token, { expires: 7 })
        Cookies.set('refresh_token', response.data.refresh_token, { expires: 7 })
        Cookies.set('session_id', response.data.session_id, { expires: 7 })
      }
      
      return response.data
    } catch (error) {
      console.error('OTP verification error:', error)
      throw error.response?.data || { message: 'Invalid verification code' }
    }
  },

  async resendOTP(email) {
    try {
      const payload = {
        verify_as: 'customer',
        store_id: STORE_ID,
        email: email
      }
      
      const response = await authClient.post('/auth/regen/', payload)
      return response.data
    } catch (error) {
      console.error('Resend OTP error:', error)
      throw error.response?.data || { message: 'Failed to resend verification code' }
    }
  },

  async changePassword(passwordData) {
    try {
      const response = await authClient.post('/auth/change-password/', {
        old_password: passwordData.oldPassword,
        new_password: passwordData.newPassword,
        store_id: STORE_ID
      })

      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Failed to change password' }
    }
  },

  async forgotPassword(email) {
    try {
        const response = await authClient.post('/auth/forgot-password/', {
            email,
            reset_as: 'customer',
            store_id: STORE_ID
        })

        return response.data
    } catch (error) {
        console.error('Forgot password error:', error)

        throw error.response?.data || {
            message: 'Failed to send reset code'
        }
    }
 },

 async resetPassword(data) {
  try {
    const response = await authClient.post('/auth/reset-password/', {
      email: data.email,
      code: data.code,
      password: data.newPassword,
      reset_as: 'customer',
      store_id: STORE_ID
    })

    return response.data
  } catch (error) {
    throw error.response?.data || {
      message: 'Failed to reset password'
    }
  }
 },

  async refreshAccessToken() {

    try {
        const refreshToken = Cookies.get('refresh_token')

        const response = await authClient.post(
            '/auth/refresh/',
            {},
            {
                headers: {
                    Authorization: `Bearer ${refreshToken}`
                }
            }
        )

        if (response.data.access_token) {
            Cookies.set('token', response.data.access_token)

        if (response.data.refresh_token) {
            Cookies.set('refresh_token', response.data.refresh_token)
        }

        return response.data.access_token
        }

        return null
    } catch (error) {
        console.error(error)
        return null
    }
  },

  async initializeAuth() {
    const token = Cookies.get("token")
    
    if (token) {
      try {
        const newToken = await this.refreshAccessToken()
        if (newToken) {
          return true
        }
      } catch (error) {
        if (Cookies.get('token')) {
          this.logout()
        }
        return false
      }
    }
    
    try {
      const newToken = await this.refreshAccessToken()
      if (newToken) {
        return true
      }
    } catch (error) {
    }
    
    return false
  },

async logout() {
  try {
    await authClient.post(
      '/auth/logout/',
      {
        session_id: Cookies.get('session_id')
      },
      {
        withCredentials: true
      }
    )
  } catch (e) {
    console.error('Logout error:', e)
  }

  Cookies.remove('token')
  Cookies.remove('refresh_token')
  Cookies.remove('session_id')

  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('customerId')
  localStorage.removeItem('userData')

  return { success: true }
},

  generateDeviceId() {
    let deviceId = localStorage.getItem('deviceId')
    if (!deviceId) {
      deviceId = 'web-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8)
      localStorage.setItem('deviceId', deviceId)
    }
    return deviceId
  },

  isAuthenticated() {
    const token = Cookies.get('token')
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    return !!token && isLoggedIn === 'true'
  }
}