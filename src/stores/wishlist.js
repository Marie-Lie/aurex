import { ref } from 'vue'
import { wishlistService } from '../api/wishlistService'
import { productService } from '../api/productService'

export const wishlist = ref([])

export async function loadWishlist() {
    try {
        const data = await wishlistService.getWishlist()

        wishlist.value = data.map(item => ({
            ...productService.transformProduct(item.product),
            wishlisted: true
        }))
    } catch (error) {
        console.error('Failed to load wishlist:', error)
    }
}

export async function toggleWishlist(product) {
    try {
        const currentlyWishlisted = isInWishlist(product.id)
        const action = currentlyWishlisted ? 'remove' : 'add'

        await wishlistService.updateWishlist(product.id, action)

        product.wishlisted = !currentlyWishlisted

        if (currentlyWishlisted) {
            wishlist.value = wishlist.value.filter(
                item => item.id !== product.id
            )
        } else {
            wishlist.value.push({
                ...product,
                wishlisted: true
            })
        }
    } catch (error) {
        console.error('Failed to update wishlist:', error)
    }
}

export function isInWishlist(productId) {
    return wishlist.value.some(item => item.id === productId)
}