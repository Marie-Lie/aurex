import apiClient from './osimart'
import { cartService } from './cartService'

const STORE_ID = import.meta.env.VITE_OSIMART_STORE_ID

export const checkoutService = {
  async getPaymentMethods() {
    try {
      const response = await apiClient.get('/payment-methods/')
      return response.data
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      throw error
    }
  },

  async getOrderHistory() {
    const response = await apiClient.get('/order-summaries/')
    return response.data
  },

  async getAvailablePaymentMethods() {
    try {
      const response = await apiClient.get('/available-payment-methods/')
      return response.data
    } catch (error) {
      console.error('Error fetching available payment methods:', error)
      throw error
    }
  },

  async createOrder(orderData) {
    let payload 

    try {
      const cartObject = {}
      orderData.items.forEach(item => {
        cartObject[item.id] = {
          product_id: item.id,
          variant_id: item.variant_id || item.id,
          quantity: item.quantity,
          price: item.price
        }
      })

      payload = {
        payment_method_id: orderData.payment.method_id,
        cart: cartObject,

        guest: {
          first_name: orderData.shipping.firstName,
          last_name: orderData.shipping.lastName,
          email: orderData.shipping.email,
          mobile_number: orderData.shipping.phone
        },

        address: {
            country: orderData.shipping.countryId,
            zone: orderData.shipping.zoneId,
            address: orderData.shipping.address,
            postal_code: orderData.shipping.postalCode
        }
      }

      const response = await apiClient.post('/checkout/', payload)
      return response.data
    } catch (error) {
      
      let errorMessage = 'Failed to create order. Please try again.'
      if (error.response?.data?.payment_method_id) {
        errorMessage = `Payment error: ${error.response.data.payment_method_id.join(' ')}`
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      }
      
      throw new Error(errorMessage)
    }
  },

  async getShippingRates(countryCode) {
    try {
      const response = await apiClient.get(`/shipping-rates/${countryCode}/`)
      return response.data
    } catch (error) {
      return this.getDefaultRates(countryCode)
    }
  },

  getDefaultRates(countryCode) {
    const rates = {
      LB: 0, AE: 10, SA: 10, KW: 10, QA: 10, BH: 10, OM: 10, JO: 10, EG: 10, IQ: 10, SY: 10, YE: 10
    }
    return {
      rate: rates[countryCode] ?? 10,
      currency: 'USD',
      estimated_days: this.getEstimatedDays(countryCode)
    }
  },

  getEstimatedDays(countryCode) {
    const days = {
      LB: '2-5', AE: '3-5', SA: '3-5', KW: '3-5', QA: '3-5', BH: '3-5', OM: '3-5', JO: '5-7', EG: '5-7', IQ: '5-7', SY: '5-7', YE: '5-7'
    }
    return days[countryCode] || '5-10'
  }
}
