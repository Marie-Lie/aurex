<script setup>
import { onMounted, onUnmounted, nextTick, ref, watch } from 'vue'
import { wishlist, loadWishlist } from '../stores/wishlist'
import ProductCard from '../components/ProductCard.vue'

let observer = null
const wishlistCount = ref(wishlist.length)

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

watch(wishlist, (newVal) => {
    wishlistCount.value = newVal.length
    nextTick(() => {
        document.querySelectorAll('.fade-in:not(.visible)').forEach(el => {
            if (observer) observer.observe(el)
        })
    })
}, { deep: true })

onMounted(async () => {
    await loadWishlist()
    setupObserver()
})

onUnmounted(() => {
    if (observer) observer.disconnect()
})
</script>

<template>
    <section class="bg-[#F5F2EB] min-h-screen overflow-hidden">
        <div class="max-w-7xl mx-auto px-8 py-24 fade-in"
             style="opacity: 0; transform: translateY(40px); transition: all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
            <p class="uppercase tracking-[0.3em] text-[#C6A769] text-sm">
                Account
            </p>

            <h1 class="font-['Cormorant_Garamond'] text-6xl text-[#1F3B2D] mt-4">
                Wishlist
            </h1>

            <p class="mt-6 text-gray-600">
                Your saved favorites.
            </p>
        </div>

        <div class="mb-8 max-w-7xl mx-auto px-8 fade-in"
             style="opacity: 0; transform: translateY(20px); transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s;">
            <p class="text-sm uppercase tracking-[0.2em] text-gray-500 transition-all duration-300 hover:text-[#C6A769]">
                Showing {{ wishlist.length }} {{ wishlist.length === 1 ? 'product' : 'products' }}
            </p>
        </div>

        <div v-if="wishlist.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-8 pb-24">
            <ProductCard
                v-for="(product, index) in wishlist"
                :key="product.id"
                :product="product"
                class="fade-in"
                :style="{
                    opacity: 0,
                    transform: 'translateY(30px)',
                    transition: `all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${Math.min(index * 80, 500)}ms`
                }"
            />
        </div>

        <div v-else class="text-center py-24 fade-in"
             style="opacity: 0; transform: scale(0.95); transition: all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s;">
            <div class="text-7xl mb-6">❤️</div>
            <h2 class="font-['Cormorant_Garamond'] text-5xl text-[#1F3B2D]">
                Your Wishlist Is Empty
            </h2>

            <p class="mt-6 text-gray-600 max-w-md mx-auto">
                Save your favorite products and they'll appear here.
            </p>

            <router-link
                to="/Shop"
                class="inline-block mt-10 bg-[#1F3B2D] text-white px-10 py-4 uppercase tracking-[0.2em] transition-all duration-300 hover:bg-[#2C4D3A] hover:scale-105 hover:shadow-2xl active:scale-95 relative overflow-hidden group"
            >
                <span class="relative z-10">Explore Collection</span>
                <span class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></span>
            </router-link>
        </div>
    </section>
</template>

<style scoped>
.fade-in {
    will-change: transform, opacity;
}

.fade-in.visible {
    opacity: 1 !important;
    transform: translate(0) scale(1) !important;
}

.hover\:shadow-2xl:hover {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

button:active {
    transform: scale(0.95);
}
</style>