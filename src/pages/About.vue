<script setup>
import { onMounted, onUnmounted, nextTick } from 'vue'

let observer = null

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

onMounted(() => {
    setupObserver()
})

onUnmounted(() => {
    if (observer) observer.disconnect()
})
</script>

<template>
    <section class="bg-[#F5F2EB] min-h-screen overflow-hidden">
        <div class="max-w-7xl mx-auto px-8 py-24 text-center fade-in"
             style="opacity: 0; transform: translateY(40px); transition: all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
            <p class="uppercase tracking-[0.4em] text-[#C6A769] text-sm mb-6">
                About Aurex
            </p>

            <h1 class="font-['Cormorant_Garamond'] text-7xl text-[#1F3B2D] leading-none mb-8">
                Crafted for the Modern Gentleman
            </h1>

            <p class="max-w-3xl mx-auto text-[#4A5A52] text-lg leading-8">
                AUREX combines timeless craftsmanship with contemporary design,
                creating menswear that embodies confidence, sophistication,
                and individuality. Every piece is carefully curated to deliver
                exceptional quality and effortless elegance.
            </p>
        </div>

        <div class="bg-white max-w-7xl mx-auto px-8 py-24 overflow-hidden">
            <div class="grid grid-cols-2 gap-20 items-center">
                <div class="fade-in"
                     style="opacity: 0; transform: translateX(-40px); transition: all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s;">
                    <p class="uppercase tracking-[0.4em] text-[#C6A769] text-sm mb-4">
                        Our Story
                    </p>

                    <h2 class="font-['Cormorant_Garamond'] text-5xl text-[#1F3B2D] mb-6">
                        Timeless Craftsmanship,
                        Modern Vision
                    </h2>

                    <p class="text-[#4A5A52] leading-8 mb-6">
                        Founded with a passion for refined menswear,
                        AUREX was created to bridge the gap between
                        timeless elegance and contemporary style.
                    </p>

                    <p class="text-[#4A5A52] leading-8">
                        Every collection is designed with careful
                        attention to detail, premium materials,
                        and a commitment to creating pieces that
                        inspire confidence in every occasion.
                    </p>
                </div>

                <div class="fade-in"
                     style="opacity: 0; transform: translateX(40px); transition: all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s;">
                    <img
                        src="/assets/images/about-story.webp"
                        alt="Aurex Story"
                        class="w-full h-[500px] object-cover shadow-lg transition-all duration-700 hover:shadow-2xl hover:scale-[1.02]"
                    >
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-8 py-24 overflow-hidden">
            <div class="text-center mb-16 fade-in"
                 style="opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
                <p class="uppercase tracking-[0.4em] text-[#C6A769] text-sm mb-4">
                    Our Values
                </p>

                <h2 class="font-['Cormorant_Garamond'] text-5xl text-[#1F3B2D]">
                    What Defines AUREX
                </h2>
            </div>

            <div class="grid grid-cols-3 gap-8">
                <div v-for="(value, index) in values"
                     :key="index"
                     class="bg-white p-10 text-center shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-3 fade-in"
                     :style="{
                         opacity: 0,
                         transform: 'translateY(30px)',
                         transition: `all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${0.3 + (index * 0.15)}s`
                     }">
                    <div class="w-16 h-0.5 bg-[#C6A769] mx-auto mb-6 transition-all duration-500 group-hover:w-24"></div>
                    <h3 class="font-['Cormorant_Garamond'] text-3xl text-[#1F3B2D] mb-4">
                        {{ value.title }}
                    </h3>
                    <p class="text-[#4A5A52] leading-7">
                        {{ value.desc }}
                    </p>
                </div>
            </div>

            <div class="max-w-5xl mx-auto px-8 py-32 text-center fade-in"
                 style="opacity: 0; transform: scale(0.95); transition: all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s;">
                <p class="uppercase tracking-[0.4em] text-[#C6A769] text-sm mb-8">
                    Our Philosophy
                </p>

                <blockquote class="font-['Cormorant_Garamond'] text-6xl text-[#1F3B2D] leading-tight">
                    Style is not about trends.
                    <br>
                    It is about confidence.
                </blockquote>

                <div class="w-24 h-px bg-[#C6A769] mx-auto mt-8"></div>
            </div>

            <div class="bg-[#1F3B2D] text-center py-24 rounded-lg fade-in"
                 style="opacity: 0; transform: translateY(40px); transition: all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s;">
                <h2 class="font-['Cormorant_Garamond'] text-5xl text-white mb-6">
                    Discover the Collection
                </h2>

                <p class="text-gray-300 mb-10 max-w-2xl mx-auto">
                    Explore timeless pieces designed for the modern gentleman.
                </p>

                <router-link
                    to="/shop"
                    class="inline-block px-10 py-4 border border-[#C6A769] text-[#C6A769] uppercase tracking-[0.3em] transition-all duration-300 hover:bg-[#C6A769] hover:text-black hover:scale-105 hover:shadow-2xl active:scale-95"
                >
                    Shop Now
                </router-link>
            </div>
        </div>
    </section>
</template>

<script>
export default {
    data() {
        return {
            values: [
                {
                    title: 'Quality',
                    desc: 'We carefully select premium fabrics and materials to ensure lasting comfort, durability, and style.'
                },
                {
                    title: 'Craftsmanship',
                    desc: 'Every detail is thoughtfully refined, blending traditional techniques with modern precision.'
                },
                {
                    title: 'Timeless Design',
                    desc: 'We create pieces that transcend trends, offering elegance that remains relevant season after season.'
                }
            ]
        }
    }
}
</script>

<style scoped>
section {
    scroll-margin-top: 80px;
}

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

img {
    transition: all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
</style>