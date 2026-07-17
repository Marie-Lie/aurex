<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { bannerService } from '../api/bannerService'
import { productService } from '../api/productService'
import ProductCard from '../components/ProductCard.vue'

const banner = ref(null)
const loading = ref(false)
const error = ref(null)
const products = ref([])
const productsLoading = ref(false)

let observer = null

const observeElements = () => {
  if (observer) {
    observer.disconnect()
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
      }
    })
  }, {
    threshold: 0.15
  })

  document.querySelectorAll('.scroll-animate').forEach((el) => {
    observer.observe(el)
  })
}

const fetchBanner = async () => {
  loading.value = true
  error.value = null

  try {
    const data = await bannerService.getActiveBanner()

    if (data) {
      banner.value = data
      await nextTick()
      observeElements()
    } else {
      console.warn('No banner found in API')
    }
  } catch (err) {
    console.error('Error loading banner:', err)
    error.value = 'Failed to load banner'
  } finally {
    loading.value = false
  }
}

const fetchProducts = async () => {
  productsLoading.value = true

  try {
    const data = await productService.getHomepageProducts()

    products.value = data
      .map(product => productService.transformProduct(product))

  } catch (err) {
    console.error('Error fetching products:', err)
  } finally {
    productsLoading.value = false
  }
}

onMounted(() => {
  fetchBanner()
  fetchProducts()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<template>  
  <section id="hero" class="relative h-screen overflow-hidden text-white">
    <video
      v-if="banner?.image?.path"
      autoplay
      muted
      loop
      playsinline
      class="absolute inset-0 w-full h-full object-cover"
      @loadeddata="console.log('Video loaded successfully')"
      @error="console.log('Video failed to load')"
    >
      <source :src="banner.image.path" type="video/mp4">
    </video>

    <div class="absolute inset-0 bg-black/40"></div>

    <div
      v-if="banner"
      class="relative z-10 max-w-7xl mx-auto px-8 pt-56 scroll-animate opacity-0 translate-y-12"
    >
      <p class="uppercase tracking-[0.5em] text-sm text-[#C6A769]">
        SEASONAL COLLECTION
      </p>

      <h1 class="font-['Cormorant_Garamond'] text-7xl font-bold mt-4">
        {{ banner.title }}
      </h1>

      <p class="mt-4 text-lg max-w-md">
        {{ banner.subtitle }}
      </p>

      <router-link
        v-if="banner.button_title"
        to="/shop"
        class="inline-block mt-8 px-8 py-3 bg-[#C6A769] text-black uppercase text-sm transition-all duration-300 hover:bg-[#d4af37] hover:scale-105 hover:shadow-2xl active:scale-95"
      >
        {{ banner.button_title }}
      </router-link>
    </div>

    <div class="absolute bottom-10 inset-x-0 z-10">
      <div class="max-w-7xl mx-auto px-8">
        <div class="flex items-center gap-4">
          <p class="text-sm uppercase tracking-[0.4em] text-white/80">
            SCROLL TO DISCOVER
          </p>
          <div class="w-16 h-px bg-[#C6A769]"></div>
        </div>
      </div>
    </div>
  </section>

  <section id="about" class="bg-[#F5F2EB] py-24 overflow-hidden">
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-20 px-8">
      <div class="w-1/2 scroll-animate"
           :class="{'opacity-0 -translate-x-20': true, 'is-visible': false}">
        <img
          src="/assets/images/about.jpg"
          alt="Men's Fashion Collection"
          class="w-full h-96 object-cover rounded-lg shadow-2xl 
                 transition-transform duration-700 hover:scale-[1.02]"
        >
      </div>

      <div class="w-1/2 scroll-animate"
           :class="{'opacity-0 translate-x-20': true, 'is-visible': false}">
        <p class="text-[#C6A769] uppercase tracking-[0.5em] text-xs mb-4">
          THE AUREX STANDARD
        </p>

        <h2 class="font-['Cormorant_Garamond'] text-5xl text-[#1F3B2D] leading-tight mb-8">
          Tailored for the man who chooses distinction.
        </h2>

        <p class="text-gray-600 mb-8 leading-relaxed">
          AUREX is built on a quiet confidence — refined silhouettes,
          premium craftsmanship, and timeless essentials designed
          to move effortlessly between work, leisure, and evening.
        </p>

        <div class="flex items-center gap-4 group">
          <div class="w-16 h-px bg-[#C6A769] transition-all duration-500 group-hover:w-24"></div>
          <p class="italic text-gray-500 transition-colors duration-300 group-hover:text-[#C6A769]">
            Designed with intention.
          </p>
        </div>
      </div>
    </div>
  </section>

  <section id="features" class="bg-[#0F2E24] text-white py-20 overflow-hidden">
    <div class="max-w-7xl mx-auto px-8">
      <div class="flex justify-between items-start mb-16 scroll-animate"
           :class="{'opacity-0 translate-y-10': true, 'is-visible': false}">
        <div>
          <p class="text-[#C6A769] uppercase tracking-[0.5em] text-xs mb-4">
            OUR PROMISE
          </p>
          <h2 class="font-['Cormorant_Garamond'] text-5xl">
            A finer way to dress.
          </h2>
        </div>
        <div class="max-w-md text-gray-300">
          <p>
            Everything we create is guided by restraint,
            precision, and a deep respect for timeless essentials.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-4 border-t border-white/20 pt-8 gap-0">
        <div 
          v-for="(feature, index) in features" 
          :key="index"
          class="px-8 py-6 transition-all duration-500 hover:bg-white/5 hover:scale-[1.02] hover:rounded-lg scroll-animate"
          :class="[
            index === 0 ? 'pl-0' : '',
            index === 3 ? 'pr-0' : '',
            index < 3 ? 'border-r border-white/20' : '',
            'opacity-0 translate-y-8'
          ]"
          :style="{ transitionDelay: (index * 100) + 'ms' }"
        >
          <p class="text-[#C6A769] text-sm mb-4 transition-colors duration-300 group-hover:text-[#d4af37]">
            {{ String(index + 1).padStart(2, '0') }}
          </p>
          <h3 class="mb-4 transition-colors duration-300 hover:text-[#C6A769]">{{ feature.title }}</h3>
          <p class="text-gray-300 text-sm">{{ feature.desc }}</p>
        </div>
      </div>
    </div>
  </section>

  <section id="collections" class="bg-[#F5F2EB] py-20 overflow-hidden">
    <div class="max-w-7xl mx-auto px-8">
      <div class="mb-12 scroll-animate"
           :class="{'opacity-0 translate-y-8': true, 'is-visible': false}">
        <p class="text-[#C6A769] uppercase tracking-[0.5em] text-xs mb-4">
          CURATED WARDROBE
        </p>
        <div class="flex justify-between items-center">
          <h2 class="font-['Cormorant_Garamond'] text-4xl text-[#1F3B2D]">
            New Arrivals
          </h2>
          <router-link 
            to="/shop"
            class="text-sm uppercase tracking-widest text-[#1F3B2D] 
                   transition-all duration-300 hover:text-[#C6A769] 
                   hover:scale-105 hover:translate-x-1 inline-block"
          >
            VIEW ALL COLLECTIONS →
          </router-link>
        </div>
      </div>

      <div v-if="productsLoading" class="flex justify-center py-20">
        <div class="text-xl text-[#1F3B2D]">Loading products...</div>
      </div>

      <div v-else-if="products.length > 0" class="grid grid-cols-3 gap-4">
        <ProductCard
          v-for="(product, index) in products"
          :key="product.id"
          :product="product"
        />
      </div>

      <div v-else class="text-center py-20">
        <p class="text-gray-500">No products available</p>
      </div>
    </div>
  </section>

  <section id="audience" class="bg-[#ECE7DF] py-24 overflow-hidden">
    <div class="max-w-7xl mx-auto px-8 grid grid-cols-2 gap-20">
      <div class="scroll-animate"
           :class="{'opacity-0 -translate-x-16': true, 'is-visible': false}">
        <p class="text-[#C6A769] uppercase tracking-[0.5em] text-xs mb-4">
          MADE FOR
        </p>
        <h2 class="font-['Cormorant_Garamond'] text-5xl text-[#1F3B2D]">
          Style without
          compromise.
        </h2>
      </div>

      <div class="grid grid-cols-2 gap-x-12 gap-y-10">
        <div 
          v-for="(item, index) in audienceItems" 
          :key="index"
          class="border-t border-gray-300 pt-4 transition-all duration-500 
                 hover:pl-4 hover:border-[#C6A769] scroll-animate"
          :class="['opacity-0 translate-y-6']"
          :style="{ transitionDelay: (index * 120 + 200) + 'ms' }"
        >
          <h3 class="font-['Cormorant_Garamond'] mb-2 transition-colors duration-300 hover:text-[#C6A769]">
            {{ item.title }}
          </h3>
          <p class="text-sm text-gray-500">{{ item.desc }}</p>
        </div>
      </div>
    </div>
  </section>

  <section 
    id="vision" 
    class="relative h-[750px] bg-cover bg-[70%_center] text-white overflow-hidden" 
    style="background-image: url('/assets/images/vision.jpg');"
  >
    <div class="absolute inset-0 bg-black/40"></div>

    <div class="relative z-10 max-w-7xl mx-auto px-8 pt-48 scroll-animate"
         :class="{'opacity-0 scale-95': true, 'is-visible': false}">
      <p class="text-[#C6A769] uppercase tracking-[0.5em] text-xs mb-6">
        OUR VISION
      </p>
      <h2 class="font-['Cormorant_Garamond'] text-6xl max-w-4xl leading-tight mb-10">
        To redefine modern elegance
        through quiet confidence.
      </h2>

      <div class="flex gap-10 text-xs uppercase tracking-widest text-gray-300 flex-wrap">
        <span 
          v-for="(tag, index) in ['Quality', 'Confidence', 'Elegance', 'Simplicity', 'Innovation']"
          :key="index"
          class="transition-all duration-300 hover:text-[#C6A769] cursor-pointer 
                 hover:scale-110 hover:translate-y-[-2px] inline-block scroll-animate"
          :class="['opacity-0 translate-y-4']"
          :style="{ transitionDelay: (index * 80 + 300) + 'ms' }"
        >
          {{ tag }}
        </span>
      </div>
    </div>
  </section>

  <section id="cta" class="bg-[#F5F2EB] py-32 overflow-hidden">
    <div class="max-w-7xl mx-auto text-center px-8 scroll-animate"
         :class="{'opacity-0 translate-y-12': true, 'is-visible': false}">
      <p class="text-[#C6A769] uppercase tracking-[0.5em] text-xs mb-6">
        DISCOVER AUREX
      </p>
      <h2 class="font-['Cormorant_Garamond'] text-6xl text-[#1F3B2D] mb-10 max-w-4xl mx-auto leading-tight">
        Experience Premium Men's Fashion
      </h2>

      <router-link 
        to="/shop" 
        class="relative inline-block bg-[#1F3B2D] text-white px-10 py-4 
               uppercase tracking-widest text-sm cursor-pointer 
               transition-all duration-500 hover:bg-[#2A4F3C] 
               hover:scale-105 hover:shadow-2xl active:scale-95
               overflow-hidden group"
      >
        <span class="relative z-10">SHOP COLLECTION</span>
        <span class="absolute inset-0 -translate-x-full group-hover:translate-x-full 
                     transition-transform duration-1000 
                     bg-gradient-to-r from-transparent via-white/20 to-transparent">
        </span>
      </router-link>
    </div>
  </section>
</template>

<script>
export default {
  data() {
    return {
      features: [
        { title: 'Premium Quality', desc: 'Refined fabrics and careful craftsmanship create pieces that endure.' },
        { title: 'Seamless Shopping', desc: 'A smooth digital experience designed to suit modern lifestyles.' },
        { title: 'Modern Design', desc: 'Minimal forms and contemporary styling built for everyday confidence.' },
        { title: 'Customer Satisfaction', desc: 'Exceptional service with attention to every detail.' }
      ],
      audienceItems: [
        { title: 'Men 18-50', desc: 'Versatile pieces designed for every chapter of modern life.' },
        { title: 'University Students', desc: 'Smart, confident essentials for everyday expression.' },
        { title: 'Young Professionals', desc: 'Modern silhouettes that transition effortlessly from office to evening.' },
        { title: 'Fashion Enthusiasts', desc: 'A curated wardrobe for those who appreciate refined style.' }
      ]
    }
  }
}
</script>

<style scoped>
section {
  scroll-margin-top: 80px;
}

.scroll-animate {
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.scroll-animate.is-visible {
  opacity: 1 !important;
  transform: translate(0) scale(1) !important;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.animate-bounce {
  animation: bounce 2s ease-in-out infinite;
}

img {
  transition: all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.hover\:shadow-2xl:hover {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.w-0 {
  width: 0;
}

.group:hover .group-hover\:w-12 {
  width: 3rem;
}
</style>