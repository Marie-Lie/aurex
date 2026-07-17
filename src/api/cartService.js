import apiClient from './osimart'

export const cartService = {
  async viewCart() {
    try {
      const response = await apiClient.get('/cart/view/')
      return response.data
    } catch (error) {
      console.error('Error fetching cart:', error)
      throw error
    }
  },

  async addItem(productId, quantity = 1) {
    try {
      const response = await apiClient.post('/cart/update-item/', {
        item_id: productId,
        action: 'add',
        quantity: quantity
      })
      return response.data
    } catch (error) {
      console.error('Error adding to cart:', error)
      throw error
    }
  },

  async updateItem(productId, quantity) {
    try {
      const response = await apiClient.post('/cart/update-item/', {
        item_id: productId,
        action: 'add',
        quantity: quantity
      })
      return response.data
      } catch (error) {
      throw error
    }
  },

  async removeItem(productId) {
    try {
      const response = await apiClient.post('/cart/update-item/', {
        item_id: productId,
        action: 'remove_all'
      })
      return response.data
      } catch (error) {
      throw error
   }
  },

  async clearCart() {
    cartLoading.value = true
    cartError.value = null
  
    try {
      if (cart.value.length > 0) {
        for (const item of cart.value) {
          await cartService.removeItem(item.id)
        }
      }
    
      cart.value = []
      return { success: true }
    } catch (error) {
      console.error('Error clearing cart:', error)
      cartError.value = 'Failed to clear cart'
      throw error
    } finally {
      cartLoading.value = false
    }
  }
}