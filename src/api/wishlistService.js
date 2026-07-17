import apiClient from './osimart'

export const wishlistService = {
    async getWishlist() {
        const response = await apiClient.get('/wishlist/')
        return response.data
    },

    async updateWishlist(productId, action) {
        const response = await apiClient.post('/wishlist/', {
            product_id: productId,
            action
        })

        return response.data
    }
}