<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { productService } from '../api/productService'
import ProductCard from '../components/ProductCard.vue'

const products = ref([])
const categories = ref([])
const loading = ref(false)
const error = ref(null)

const selectedCategory = ref('all')
const selectedSubcategory = ref(null)
const searchQuery = ref('')
let observer = null

const categoryOptions = computed(() => {
  const cats = ['all']
  categories.value.forEach(cat => {
    if (!cats.includes(cat.name)) {
      cats.push(cat.name)
    }
  })
  return cats
})

const subcategoryOptions = computed(() => {
  if (selectedCategory.value === 'all') return []
  const subs = []
  categories.value.forEach(cat => {
    if (cat.name === selectedCategory.value) {
      cat.children?.forEach(child => {
        if (!subs.includes(child.name)) {
          subs.push(child.name)
        }
      })
    }
  })
  return subs
})

const filteredProducts = computed(() => {
  let result = products.value

  if (selectedCategory.value !== 'all') {
    result = result.filter(
      product => product.category === selectedCategory.value.toLowerCase()
    )
  }

  if (selectedSubcategory.value) {
    result = result.filter(
      product => product.subcategory === selectedSubcategory.value.toLowerCase().replace(/[^a-z]/g, '')
    )
  }

  if (searchQuery.value.trim()) {
    result = result.filter(product => {
      const search = searchQuery.value.toLowerCase()
      return (
        (product.name || '').toLowerCase().includes(search) ||
        (product.details || '').toLowerCase().includes(search) ||
        String(product.price || '').toLowerCase().includes(search) ||
        (product.category || '').toLowerCase().includes(search) ||
        (product.subcategory || '').toLowerCase().includes(search)
      )
    })
  }

  return result
})

const fetchProducts = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await productService.getProducts()
    
    if (data && data.results && data.results.length > 0) {
      const mapped = data.results.map(p => productService.transformProduct(p))
      products.value = mapped
    } else {
      error.value = 'No products found'
    }
  } catch (err) {
    console.error('Error fetching products:', err)
    error.value = 'Failed to load products'
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const data = await productService.getCategories()
    
    if (data && data.results && data.results.length > 0) {
      categories.value = data.results.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slugified_name || cat.name.toLowerCase().replace(/\s+/g, '-'),
        order: cat.order || 0,
        children: cat.children || []
      }))
    }
  } catch (err) {
    console.error('Error fetching categories:', err)
  }
}

function categoryClass(category) {
  return [
    'uppercase tracking-widest text-sm transition duration-300 cursor-pointer relative',
    'after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-[#C6A769] after:transition-all after:duration-300 hover:after:w-full',
    selectedCategory.value === category
      ? 'text-[#C6A769] after:w-full'
      : 'text-[#1F3B2D] hover:text-[#C6A769]'
  ]
}

function subcategoryClass(subcategory) {
  return [
    'uppercase tracking-widest text-sm transition duration-300 cursor-pointer relative',
    'after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-[#C6A769] after:transition-all after:duration-300 hover:after:w-full',
    selectedSubcategory.value === subcategory
      ? 'text-[#C6A769] after:w-full'
      : 'text-[#1F3B2D] hover:text-[#C6A769]'
  ]
}

function setupObserver() {
  if (observer) {
    observer.disconnect()
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1 })

  nextTick(() => {
    document.querySelectorAll('.fade-in:not(.visible)').forEach(el => {
      observer.observe(el)
    })
  })
}

watch(filteredProducts, () => {
  nextTick(() => {
    document.querySelectorAll('.fade-in:not(.visible)').forEach(el => {
      el.classList.remove('visible')
      observer.observe(el)
    })
  })
}, { deep: false })

onMounted(() => {
  Promise.all([fetchProducts(), fetchCategories()])
  setupObserver()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<template>
  <section class="bg-[#F5F2EB] pt-24 pb-12 overflow-hidden">
    <div class="max-w-7xl mx-auto px-8 flex justify-between items-center fade-in"
         style="opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
      <div>
        <p class="text-[#C6A769] uppercase tracking-[0.5em] text-xs mb-4">
          THE EDIT
        </p>
        <h1 class="font-['Cormorant_Garamond'] text-6xl text-[#1F3B2D]">
          Shop AUREX
        </h1>
      </div>

      <div class="relative w-80">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search the collection"
          class="w-full bg-transparent border-b border-gray-400 py-3 pr-10 focus:outline-none focus:border-[#C6A769] transition-all duration-300 hover:border-[#C6A769]"
        >
        <img
          src="/assets/icons/search.svg"
          alt="Search"
          class="absolute right-0 top-1/2 -translate-y-1/2 h-5 opacity-60 transition-opacity duration-300 hover:opacity-100"
        >
      </div>
    </div>
  </section>

  <section class="bg-[#F5F2EB] pb-12 overflow-hidden">
    <div class="max-w-7xl mx-auto px-8 fade-in"
         style="opacity: 0; transform: translateY(20px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s;">
      <div class="flex gap-8 border-b border-gray-300 pb-4 flex-wrap">
        <button
          v-for="cat in categoryOptions"
          :key="cat"
          @click="selectedCategory = cat; selectedSubcategory = null;"
          :class="categoryClass(cat)"
        >
          {{ cat === 'all' ? 'All' : cat }}
        </button>
      </div>

      <div class="flex flex-wrap gap-6 mt-3" v-if="subcategoryOptions.length">
        <button
          v-for="sub in subcategoryOptions"
          :key="sub"
          @click="selectedSubcategory = sub"
          :class="subcategoryClass(sub)"
        >
          {{ sub }}
        </button>
      </div>
    </div>
  </section>

  <section id="products" class="bg-[#F5F2EB] py-16 overflow-hidden">
    <div class="max-w-7xl mx-auto px-8">
      <div v-if="loading" class="flex justify-center py-20">
        <div class="text-xl text-[#1F3B2D]">Loading products...</div>
      </div>

      <div v-else-if="error" class="flex justify-center py-20">
        <div class="text-xl text-red-500">{{ error }}</div>
      </div>

      <template v-else>
        <div class="mb-8 fade-in"
             style="opacity: 0; transform: translateY(15px); transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s;">
          <p class="text-sm uppercase tracking-[0.2em] text-gray-500 transition-all duration-300 hover:text-[#C6A769]">
            Showing {{ filteredProducts.length }} products
          </p>
        </div>

        <div
          v-if="filteredProducts.length > 0"
          class="grid grid-cols-3 gap-8"
        >
          <ProductCard
            v-for="product in filteredProducts"
            :key="product.id"
            :product="product"
            class="fade-in"
            :style="{
              opacity: 0,
              transform: 'translateY(30px)',
              transition: `all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s`
            }"
          />
        </div>

        <div
          v-else
          class="text-center py-24 fade-in"
          style="opacity: 0; transform: scale(0.95); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s;"
        >
          <h3 class="font-['Cormorant_Garamond'] text-4xl text-[#1F3B2D] mb-4">
            No products found
          </h3>
          <p class="text-gray-500">
            Try adjusting your search or filters.
          </p>
          <button
            @click="selectedCategory = 'all'; selectedSubcategory = null; searchQuery = '';"
            class="mt-6 px-8 py-3 bg-[#C6A769] text-black uppercase text-sm 
                   transition-all duration-300 hover:bg-[#d4af37] 
                   hover:scale-105 hover:shadow-2xl active:scale-95"
          >
            Reset Filters
          </button>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
section {
  scroll-margin-top: 80px;
}

.fade-in {
  will-change: transform, opacity;
  transition: all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.fade-in.visible {
  opacity: 1 !important;
  transform: translate(0) scale(1) !important;
}

button:active {
  transform: scale(0.95);
}

.hover\:shadow-2xl:hover {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}
</style>