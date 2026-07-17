import apiClient from './osimart'

export const shippingService = {
    async getShippingCountries() {
        try {
            const response = await apiClient.get('/shippingcountries/')

            return response.data
        } catch (error) {
            console.error('API error:', error)
            throw error
        }
    }
}