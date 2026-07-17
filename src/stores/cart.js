import { ref } from 'vue'
import { cartService } from '../api/cartService'

export const cart = ref([])
export const cartLoading = ref(false)
export const cartError = ref(null)
const API_BASE = 'https://api.osimart.com'

export async function fetchCart() {
  cartLoading.value = true
  cartError.value = null
  try {
    const data = await cartService.viewCart()

    if (data && data.cart) {
      const items = Object.entries(data.cart || {})

      cart.value = items.map(([key, item]) => ({
          cartKey: key,
          id: item.id,
          name: item.name,
          price: Number(item.price),
          image: item.image && item.image.startsWith('static/')
              ? `${API_BASE}/${item.image}`
              : item.image,
          quantity: item.quantity,
          selectedSize: item.values?.[0] || null
      }))

    } else {
      cart.value = []
    }
    return cart.value
  } catch (error) {
    console.error('Error fetching cart:', error)
    cartError.value = 'Failed to load cart'
    throw error
  } finally {
    cartLoading.value = false
  }
}

export async function addToCart(product, selectedSize = null) {
  cartLoading.value = true
  cartError.value = null

  try {

    const itemId = product.variant_id

    await cartService.addItem(itemId, 1)
    await fetchCart()

    return cart.value
  } catch (error) {
    console.error('Error adding to cart:', error)
    cartError.value = 'Failed to add to cart'
    throw error
  } finally {
    cartLoading.value = false
  }
}

export async function increaseQuantity(item) {
  cartLoading.value = true
  cartError.value = null

  try {
    const newQuantity = item.quantity + 1
    
    await cartService.removeItem(item.cartKey)
    await cartService.addItem(item.id, newQuantity)
    
    await fetchCart()
    return cart.value
  } catch (error) {
    console.error("Error increasing quantity:", error)
    cartError.value = "Failed to update quantity"
    throw error
  } finally {
    cartLoading.value = false
  }
}

export async function decreaseQuantity(item) {
  if (item.quantity <= 1) {
    await removeFromCart(item)
    return
  }
  
  cartLoading.value = true
  cartError.value = null
  
  try {
    const newQuantity = item.quantity - 1
    
    await cartService.removeItem(item.cartKey)
    await cartService.addItem(item.id, newQuantity)
    
    await fetchCart()
    return cart.value
  } catch (error) {
    console.error('Error decreasing quantity:', error)
    cartError.value = 'Failed to update quantity'
    throw error
  } finally {
    cartLoading.value = false
  }
}

export async function removeFromCart(item) {
  cartLoading.value = true
  cartError.value = null
  try {
    await cartService.removeItem(item.id)
    await fetchCart()
    return cart.value
  } catch (error) {
    console.error('Error removing from cart:', error)
    cartError.value = 'Failed to remove from cart'
    throw error
  } finally {
    cartLoading.value = false
  }
}

export async function clearCart() {
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