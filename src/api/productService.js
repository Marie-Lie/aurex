import apiClient from './osimart'

const API_BASE = 'https://api.osimart.com'

export const productService = {
  async getProducts() {
    try {
      const response = await apiClient.get('/products/')
      return response.data
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  },

  async getProduct(id) {
    try {
      const response = await apiClient.get(`/products/${id}/`)
      return response.data
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  },

  async getCategories() {
    try {
      const response = await apiClient.get('/categories/')
      return response.data
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  },

  async getHomepageProducts() {
    try {
      const data = await this.getProducts()
      if (data.results && data.results.length > 0) {
        return data.results.slice(0, 3)
      }
      return []
    } catch (error) {
      console.error('Error fetching homepage products:', error)
      throw error
    }
  },

  transformProduct(apiProduct) {
    let imagePath = ''
    
    if (apiProduct.main_image && apiProduct.main_image.path) {
      if (apiProduct.main_image.path.startsWith('static/')) {
        imagePath = `${API_BASE}/${apiProduct.main_image.path}`
      } else {
        imagePath = apiProduct.main_image.path
      }
    } else if (apiProduct.gallery && apiProduct.gallery.length > 0) {
      const firstImage = apiProduct.gallery[0]
      if (firstImage.media && firstImage.media.path) {
        if (firstImage.media.path.startsWith('static/')) {
          imagePath = `${API_BASE}/${firstImage.media.path}`
        } else {
          imagePath = firstImage.media.path
        }
      }
    }

    const parentCategory = apiProduct.categories?.[0]?.category?.parent_category?.name || ''
    const subcategory = apiProduct.categories?.[0]?.category?.name || ''

    let features = []
    let description = apiProduct.description || apiProduct.name
    
    if (description && description.includes('<br>')) {
      const parts = description.split('<br>')
      if (parts.length > 1) {
        const lastPart = parts[parts.length - 1]
        features = lastPart.split(',').map(f => f.trim()).filter(f => f)
      }
    }

    const price = apiProduct.product_variants?.[0]?.price || parseFloat(apiProduct.price_range) || 0
    const variantId = apiProduct.product_variants?.[0]?.id || apiProduct.id

    const stock = apiProduct.remaining_stock || 0


    return {
      id: apiProduct.id,
      variant_id: variantId,
      name: apiProduct.name,
      price: price,
      image: imagePath,
      category: parentCategory.toLowerCase() || '',
      subcategory: subcategory.toLowerCase().replace(/[^a-z]/g, ''),
      details: subcategory || '',
      description: description,
      features: features.length > 0 ? features : ['Premium Quality', 'Timeless Design'],
      sizes: apiProduct.product_variants
        ? apiProduct.product_variants
        .map(variant => variant.values?.[0]?.name)
        .filter(Boolean)
        : [],
      variants: apiProduct.product_variants || [],
      stock: stock,
      in_stock: stock > 0
    }
  }
}