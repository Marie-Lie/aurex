<script setup>
import { useRouter } from 'vue-router'
import { onMounted, onUnmounted, nextTick } from 'vue'

const router = useRouter()
let observer = null

async function goToNewArrivals() {
    await router.push('/')
    requestAnimationFrame(() => {
        document
            .getElementById('collections')
            ?.scrollIntoView({
                behavior: 'smooth'
            })
    })
}

onMounted(() => {
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
})

onUnmounted(() => {
    if (observer) observer.disconnect()
})
</script>

<template>
    <div class="bg-[#0F2E24] text-white py-16 overflow-hidden">
        <div class="max-w-7xl mx-auto px-8 grid grid-cols-4 gap-12">
            <div class="fade-in">
                <h3 class="font-['Cormorant_Garamond'] text-2xl mb-4 transition-colors duration-300 hover:text-[#C6A769]">
                    AUREX
                </h3>
                <p class="text-gray-300 text-sm leading-relaxed">
                    Contemporary menswear designed with confidence, craftsmanship, and timeless appeal.
                </p>
            </div>

            <div class="fade-in">
                <h4 class="mb-4 uppercase text-sm tracking-widest text-[#C6A769]">Shop</h4>
                <ul class="space-y-2 text-gray-300">
                    <li><a @click.prevent="goToNewArrivals" class="hover:text-[#C6A769] cursor-pointer transition-all duration-300 inline-block hover:translate-x-2">New Arrivals</a></li>
                    <li><router-link class="hover:text-[#C6A769] transition-all duration-300 inline-block hover:translate-x-2" to="/Shop">Collections</router-link></li>
                    <li><router-link class="hover:text-[#C6A769] transition-all duration-300 inline-block hover:translate-x-2" to="/Profile">Profile</router-link></li>
                </ul>
            </div>

            <div class="fade-in">
                <h4 class="mb-4 uppercase text-sm tracking-widest text-[#C6A769]">Information</h4>
                <ul class="space-y-2 text-gray-300">
                    <li><router-link class="hover:text-[#C6A769] transition-all duration-300 inline-block hover:translate-x-2" to="/About">About AUREX</router-link></li>
                    <li><router-link class="hover:text-[#C6A769] transition-all duration-300 inline-block hover:translate-x-2" to="/Contact">Contact</router-link></li>
                    <li><router-link class="hover:text-[#C6A769] transition-all duration-300 inline-block hover:translate-x-2" to="/ShippingReturns">Shipping & Returns</router-link></li>
                </ul>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-8 mt-12 pt-8 border-t border-white/10">
            <p class="text-gray-400 text-sm transition-colors duration-300 hover:text-[#C6A769] text-center">
                © 2026 AUREX. All rights reserved.
            </p>
        </div>
    </div>
</template>

<style scoped>
.fade-in {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    will-change: transform, opacity;
}

.fade-in.visible {
    opacity: 1 !important;
    transform: translateY(0) !important;
}

/* Staggered delays for each column */
.fade-in:nth-child(1) {
    transition-delay: 0.1s;
}

.fade-in:nth-child(2) {
    transition-delay: 0.2s;
}

.fade-in:nth-child(3) {
    transition-delay: 0.3s;
}

.fade-in:nth-child(4) {
    transition-delay: 0.4s;
}

button:active {
    transform: scale(0.95);
}
</style>