<script setup>
import { formatPrice } from '../stores/currency'
import { toggleWishlist, isInWishlist } from '../stores/wishlist'
import { computed, ref } from 'vue'
import StockBadge from './StockBadge.vue'

const props = defineProps({
    product: {
        type: Object,
        required: true
    }
})

const inWishlist = computed(() => {
    if (!props.product || !props.product.id) return false
    return isInWishlist(props.product.id)
})

function handleWishlistToggle(event) {
    event.stopPropagation()
    if (props.product && props.product.id) {
        toggleWishlist(props.product)
    }
}
</script>

<template>
    <div
        class="group flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
    >
        <div class="relative overflow-hidden">
            <img
                :src="product.image"
                :alt="product.name"
                class="w-full h-[420px] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
            >

            <div class="absolute top-4 right-4 z-10 group/heart">
                <button
                    @click="handleWishlistToggle"
                    class="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-[#C6A769] hover:bg-[#C6A769] hover:text-white cursor-pointer transition-all duration-300 hover:scale-110 active:scale-90"
                >
                    <span class="transition-transform duration-300" :class="inWishlist ? 'scale-110' : ''">
                        {{ inWishlist ? '♥' : '♡' }}
                    </span>
                </button>

                <div
                    class="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#1F3B2D] text-white text-xs px-3 py-2 rounded-md whitespace-nowrap opacity-0 group-hover/heart:opacity-100 transition-all duration-300 pointer-events-none"
                >
                    {{ inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist' }}
                </div>
            </div>

            <div class="absolute bottom-3 left-3 z-10">
                <StockBadge :stock="product.stock" size="sm" />
            </div>
        </div>

        <div class="bg-[#EFEBE2] p-5 flex flex-col flex-grow">
            <div class="flex justify-between items-start">
                <h3 class="font-['Cormorant_Garamond'] text-3xl text-[#1F3B2D] leading-tight">
                    {{ product.name }}
                </h3>

                <span class="text-[#1F3B2D] text-lg font-medium">
                    {{ formatPrice(product.price) }}
                </span>
            </div>

            <p class="mt-3 text-xs uppercase tracking-[0.3em] text-gray-500 min-h-[40px]">
                {{ product.details }}
            </p>

            <router-link
                :to="`/product/${product.id}`"
                class="w-full text-center mt-auto py-3 border border-[#1F3B2D] uppercase tracking-[0.3em] text-xs text-[#1F3B2D] transition-all duration-300 hover:bg-[#1F3B2D] hover:text-white hover:scale-[1.02] active:scale-95"
            >
                View
            </router-link>
        </div>
    </div>
</template>

<style scoped>
button:active {
    transform: scale(0.9);
}
</style>