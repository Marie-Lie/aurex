import apiClient from './osimart'

export const bannerService = {
  async getBanners() {
    try {
      const response = await apiClient.get('/banners/')
      return response.data
    } catch (error) {
      console.error('Error fetching banners:', error)
      throw error
    }
  },

  async getActiveBanner() {
    try {
      const data = await this.getBanners()
      
      if (data && data.results && data.results.length > 0) {
        return data.results[0]
      }
      
      return null
    } catch (error) {
      console.error('Error fetching active banner:', error)
      throw error
    }
  }
}