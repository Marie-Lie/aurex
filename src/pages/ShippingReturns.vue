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
    <section class="bg-[#F5F2EB] overflow-hidden">
        <div class="max-w-7xl mx-auto px-8 py-24 fade-in"
             style="opacity: 0; transform: translateY(40px); transition: all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
            <p class="uppercase tracking-[0.3em] text-[#C6A769] text-sm">
                Information
            </p>

            <h1 class="font-['Cormorant_Garamond'] text-6xl text-[#1F3B2D] mt-4">
                Shipping & Returns
            </h1>

            <p class="mt-6 text-gray-600 max-w-2xl">
                Clear delivery timelines,
                simple return policies,
                and a seamless shopping experience.
            </p>
        </div>

        <div class="max-w-7xl mx-auto px-8 pb-20">
            <div class="mb-12 fade-in"
                 style="opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
                <p class="text-[#C6A769] uppercase tracking-[0.5em] text-xs mb-4">
                    SHIPPING OPTIONS
                </p>

                <h2 class="font-['Cormorant_Garamond'] text-5xl text-[#1F3B2D]">
                    Delivery Designed Around You
                </h2>
            </div>

            <div class="grid md:grid-cols-3 gap-8">
                <div v-for="(option, index) in shippingOptions"
                     :key="index"
                     class="bg-white p-8 border border-transparent shadow-sm transition-all duration-500 hover:border-[#C6A769] hover:shadow-xl hover:-translate-y-2 cursor-pointer fade-in"
                     :style="{
                         opacity: 0,
                         transform: 'translateY(30px)',
                         transition: `all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${0.2 + (index * 0.15)}s`
                     }">
                    <div class="w-12 h-0.5 bg-[#C6A769] mb-6 transition-all duration-500 group-hover:w-16"></div>
                    <h3 class="font-['Cormorant_Garamond'] text-3xl text-[#1F3B2D]">
                        {{ option.title }}
                    </h3>
                    <p class="mt-4 text-gray-600">
                        {{ option.desc }}
                    </p>
                    <p class="mt-4 text-[#C6A769] font-medium">
                        {{ option.price }}
                    </p>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-8 py-20">
            <div class="mb-12 fade-in"
                 style="opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
                <p class="text-[#C6A769] uppercase tracking-[0.5em] text-xs mb-4">
                    DELIVERY TIMES
                </p>

                <h2 class="font-['Cormorant_Garamond'] text-5xl text-[#1F3B2D]">
                    Estimated Shipping Times
                </h2>
            </div>

            <div class="bg-white border border-gray-200 shadow-sm overflow-hidden fade-in"
                 style="opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s;">
                <div class="grid grid-cols-2 bg-[#1F3B2D] text-white uppercase tracking-[0.2em] text-sm">
                    <div class="p-5">Region</div>
                    <div class="p-5">Delivery Time</div>
                </div>

                <div v-for="(region, index) in deliveryTimes"
                     :key="index"
                     class="grid grid-cols-2 border-b border-gray-200 transition-all duration-300 hover:bg-[#F5F2EB]"
                     :class="index === deliveryTimes.length - 1 ? 'border-b-0' : ''">
                    <div class="p-5 font-medium">{{ region.region }}</div>
                    <div class="p-5 text-gray-600">{{ region.time }}</div>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-8 py-20">
            <div class="mb-12 fade-in"
                 style="opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
                <p class="text-[#C6A769] uppercase tracking-[0.5em] text-xs mb-4">
                    RETURNS & EXCHANGES
                </p>

                <h2 class="font-['Cormorant_Garamond'] text-5xl text-[#1F3B2D]">
                    Shop With Confidence
                </h2>
            </div>

            <div class="grid md:grid-cols-2 gap-8">
                <div v-for="(item, index) in returnItems"
                     :key="index"
                     class="group bg-white p-10 border border-transparent shadow-sm transition-all duration-500 hover:border-[#C6A769] hover:shadow-xl hover:-translate-y-2 fade-in"
                     :style="{
                         opacity: 0,
                         transform: 'translateY(30px)',
                         transition: `all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${0.2 + (index * 0.15)}s`
                     }">
                    <div class="w-12 h-0.5 bg-[#C6A769] mb-6 transition-all duration-500 group-hover:w-16"></div>
                    <h3 class="font-['Cormorant_Garamond'] text-3xl text-[#1F3B2D] transition-colors duration-300 group-hover:text-[#C6A769]">
                        {{ item.title }}
                    </h3>
                    <p class="mt-6 text-gray-600 leading-8">
                        {{ item.desc }}
                    </p>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-8 py-20">
            <div class="mb-12 fade-in"
                 style="opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
                <p class="text-[#C6A769] uppercase tracking-[0.5em] text-xs mb-4">
                    REFUND POLICY
                </p>

                <h2 class="font-['Cormorant_Garamond'] text-5xl text-[#1F3B2D]">
                    Transparent Refund Process
                </h2>
            </div>

            <div class="group bg-white p-12 border border-transparent shadow-sm transition-all duration-500 hover:border-[#C6A769] hover:shadow-xl fade-in"
                 style="opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s;">
                <p class="text-gray-600 leading-8 text-lg">
                    Once returned items are received
                    and inspected, eligible refunds
                    will be processed to the original
                    payment method used during purchase.
                </p>

                <p class="mt-6 text-gray-600 leading-8">
                    Refund processing times may vary
                    depending on your payment provider,
                    but most refunds are completed
                    within 5–10 business days after
                    approval.
                </p>

                <div class="mt-8 pt-8 border-t border-gray-200">
                    <p class="text-[#C6A769] uppercase tracking-[0.2em] text-sm">
                        Important Note
                    </p>
                    <p class="mt-3 text-gray-600">
                        Shipping fees are generally
                        non-refundable unless the
                        return is the result of a
                        defective or incorrect item.
                    </p>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-8 py-20">
            <div class="mb-12 fade-in"
                 style="opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
                <p class="text-[#C6A769] uppercase tracking-[0.5em] text-xs mb-4">
                    FAQ
                </p>

                <h2 class="font-['Cormorant_Garamond'] text-5xl text-[#1F3B2D]">
                    Frequently Asked Questions
                </h2>
            </div>

            <div class="space-y-6">
                <div v-for="(faq, index) in faqs"
                     :key="index"
                     class="group bg-white p-8 border border-transparent shadow-sm transition-all duration-500 hover:border-[#C6A769] hover:shadow-xl hover:-translate-y-1 cursor-pointer fade-in"
                     :style="{
                         opacity: 0,
                         transform: 'translateY(20px)',
                         transition: `all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${0.1 + (index * 0.1)}s`
                     }">
                    <div class="flex items-start justify-between">
                        <h3 class="font-['Cormorant_Garamond'] text-2xl text-[#1F3B2D] transition-colors duration-300 group-hover:text-[#C6A769]">
                            {{ faq.question }}
                        </h3>
                        <span class="text-[#C6A769] text-2xl transition-transform duration-300 group-hover:rotate-90">+</span>
                    </div>
                    <p class="mt-4 text-gray-600">
                        {{ faq.answer }}
                    </p>
                </div>
            </div>
        </div>

        <div class="max-w-4xl mx-auto text-center px-8 pb-20 fade-in"
             style="opacity: 0; transform: translateY(40px); transition: all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s;">
            <p class="uppercase tracking-[0.5em] text-[#C6A769] text-xs mb-6">
                NEED HELP?
            </p>

            <h2 class="font-['Cormorant_Garamond'] text-5xl mb-8 text-[#1F3B2D]">
                We're Here To Assist You
            </h2>

            <p class="text-gray-500 max-w-2xl mx-auto mb-10">
                If you have any questions regarding
                shipping, returns, exchanges, or your
                order, our support team is ready to help.
            </p>

            <router-link
                to="/Contact"
                class="inline-block bg-[#C6A769] text-black px-10 py-4 uppercase tracking-[0.2em] transition-all duration-300 hover:bg-[#d4af37] hover:scale-105 hover:shadow-2xl active:scale-95 relative overflow-hidden group"
            >
                <span class="relative z-10">Contact Us</span>
                <span class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></span>
            </router-link>
        </div>
    </section>
</template>

<script>
export default {
    data() {
        return {
            shippingOptions: [
                {
                    title: 'Standard Shipping (Lebanon)',
                    desc: 'Free delivery within 2–5 business days across Lebanon.',
                    price: 'FREE'
                },
                {
                    title: 'Express Shipping (Lebanon)',
                    desc: 'Express delivery within 1–2 business days across Lebanon.',
                    price: '$5 flat rate'
                },
                {
                    title: 'International Shipping',
                    desc: 'Available to selected destinations worldwide.',
                    price: 'Starts at $5'
                }
            ],
            deliveryTimes: [
                { region: 'Lebanon', time: '2–5 Business Days' },
                { region: 'Middle East', time: '5–8 Business Days' },
                { region: 'Asia', time: '7–10 Business Days' },
                { region: 'Europe', time: '7–12 Business Days' },
                { region: 'Africa', time: '8–12 Business Days' },
                { region: 'North/South America & Australia', time: '10–15 Business Days' }
            ],
            returnItems: [
                {
                    title: 'Returns',
                    desc: 'Items may be returned within 30 days of delivery. Products must be unworn, unused, and returned in their original packaging with all tags attached. Return shipping costs are the responsibility of the customer unless the item is defective.'
                },
                {
                    title: 'Exchanges',
                    desc: 'Size and product exchanges are available subject to stock availability. Exchange requests must be submitted within 30 days of receiving your order. Customers are responsible for return shipping fees.'
                }
            ],
            faqs: [
                {
                    question: 'How do I track my order?',
                    answer: 'Visit your Order Tracking & History page from your account dashboard to view the latest order status updates. For local orders, tracking is provided by LibanPost.'
                },
                {
                    question: 'Can I exchange a size?',
                    answer: 'Yes. Exchanges are available within 30 days of delivery, subject to product availability. Please contact our support team to initiate an exchange.'
                },
                {
                    question: 'How long do refunds take?',
                    answer: 'Most refunds are processed within 5–10 business days after approval. The time it takes for the refund to appear in your account may vary depending on your payment provider.'
                },
                {
                    question: 'Do you ship internationally?',
                    answer: 'Yes. International shipping is available to selected countries. Delivery times vary by region and customs processing may add additional time.'
                }
            ]
        }
    }
}
</script>

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