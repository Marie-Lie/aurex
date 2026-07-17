<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { checkoutService } from '../api/checkoutService'

let observer = null

const orders = ref([])

const currentOrders = computed(() => {
    return orders.value.filter(
        order =>
            order.status === 'Processing' ||
            order.status === 'Shipping'
    )
})

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

async function loadOrders() {
    try {
        const data = await checkoutService.getOrderHistory()

        orders.value = data.map(order => ({
            id: order.id,
            items: order.items,
            total: `$${order.checkout_order_total}`,
            date: new Date(order.purchased_at).toLocaleDateString(
                'en-US',
                {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                }
            ),

            status:
                order.statuses?.length
                    ? order.statuses.at(-1).status_name
                    : 'Processing'
        }))

    } catch (err) {
        console.error(err)
    }
}

onMounted(async () => {
    await loadOrders()
    await nextTick()
    setupObserver()
})

onUnmounted(() => {
    if (observer) observer.disconnect()
})
</script>

<template>
    <section class="bg-[#F5F2EB] min-h-screen pb-20 overflow-hidden">
        <div class="max-w-6xl mx-auto px-8 py-24 fade-in"
             style="opacity: 0; transform: translateY(40px); transition: all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
            <p class="uppercase tracking-[0.3em] text-[#C6A769] text-sm">
                Account
            </p>

            <h1 class="font-['Cormorant_Garamond'] text-6xl text-[#1F3B2D] mt-4">
                Order Tracking & History
            </h1>

            <p class="mt-6 text-gray-600 max-w-2xl">
                View your previous purchases,
                track current orders,
                and manage your order activity.
            </p>
        </div>

        <div class="max-w-6xl mx-auto bg-white border border-gray-200 shadow-sm p-12 fade-in"
             style="opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s;">
            <p class="uppercase tracking-[0.3em] text-[#C6A769] text-sm">
                Current Order(s)
            </p>

            <div v-if="currentOrders.length" class="mt-6 space-y-8">
                <div v-for="(order, index) in currentOrders"
                     :key="order.id"
                     class="flex flex-col md:flex-row justify-between gap-10 border-b border-gray-200 pb-8 fade-in"
                     :style="{
                         opacity: 0,
                         transform: 'translateY(20px)',
                         transition: `all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${0.3 + (index * 0.15)}s`
                     }">
                    <div class="transition-all duration-300 hover:pl-4">
                        <h2 class="font-['Cormorant_Garamond'] text-4xl text-[#1F3B2D] mt-3">
                            #{{ order.id }}
                        </h2>

                        <p class="text-gray-500 text-base mt-6">
                            {{ order.items[0].name }}

                            <span v-if="order.items.length > 1" class="text-gray-500 text-base">
                                + {{ order.items.length - 1 }} more item(s)
                            </span>
                        </p>

                        <p class="text-sm text-gray-400 mt-2">
                            {{ order.items.length }} item(s) total
                        </p>
                    </div>

                    <div>
                        <p class="uppercase tracking-[0.2em] text-sm text-gray-500">
                            Status
                        </p>

                        <div class="mt-6">
                            <div class="flex items-center gap-3 group">
                                <div class="w-8 h-8 rounded-full flex items-center justify-center text-white bg-[#1F3B2D] transition-all duration-300 group-hover:scale-110">
                                    ✓
                                </div>
                                <span class="transition-colors duration-300 group-hover:text-[#C6A769]">Processing</span>
                            </div>

                            <div class="h-8 w-[2px] bg-gray-300 ml-4"></div>

                            <div class="flex items-center gap-3 group">
                                <div class="w-8 h-8 rounded-full flex items-center justify-center text-white" :class="order.status === 'Shipping' ? 'bg-[#1F3B2D]' : 'bg-gray-300'">
                                    ✓
                                </div>
                                <span class="transition-colors duration-300 group-hover:text-[#C6A769]">Shipping</span>
                            </div>

                            <div class="h-8 w-[2px] bg-gray-300 ml-4"></div>

                            <div class="flex items-center gap-3 group">
                                <div class="w-8 h-8 rounded-full flex items-center justify-center text-white bg-gray-300">
                                    ✓
                                </div>
                                <span class="text-gray-400">Delivered</span>
                            </div>
                        </div>

                        <p class="uppercase tracking-[0.2em] text-sm text-gray-500 mt-8">
                            Ordered
                        </p>

                        <p class="text-[#1F3B2D] mt-2 text-lg font-medium">
                            {{ order.date }}
                        </p>

                        <p class="text-sm text-[#C6A769] mt-2 font-medium">
                            Total: {{ order.total }}
                        </p>
                    </div>
                </div>
            </div>

            <div v-else class="text-center py-10">
                <div class="text-6xl mb-4">📦</div>
                <p class="text-gray-500 text-lg">
                    No active orders.
                </p>
                <router-link to="/shop" class="inline-block mt-4 text-[#C6A769] hover:underline transition-all duration-300 hover:scale-105">
                    Start Shopping
                </router-link>
            </div>
        </div>

        <div class="max-w-6xl mx-auto mt-10 bg-white border border-gray-200 shadow-sm p-12 fade-in"
             style="opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s;">
            <h2 class="font-['Cormorant_Garamond'] text-5xl text-[#1F3B2D]">
                Order History
            </h2>

            <p class="text-gray-500 text-sm mt-2">
                {{ orders.length }} order(s) total
            </p>

            <div v-if="orders.length" class="mt-10 space-y-6">
                <div v-for="(order, index) in orders"
                     :key="order.id"
                     class="border border-gray-200 p-6 transition-all duration-500 hover:border-[#C6A769] hover:shadow-xl hover:-translate-y-1 cursor-pointer fade-in"
                     :style="{
                         opacity: 0,
                         transform: 'translateY(20px)',
                         transition: `all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${0.2 + (index * 0.08)}s`
                     }">
                    <div class="flex justify-between items-start">
                        <h2 class="font-['Cormorant_Garamond'] text-3xl text-[#1F3B2D] transition-colors duration-300 group-hover:text-[#C6A769]">
                            #{{ order.id }}
                        </h2>
                        <span class="text-sm font-medium" :class="order.status === 'Processing' ? 'text-yellow-600' : order.status === 'shipping' ? 'text-blue-600' : 'text-green-600'">
                            ● {{ order.status }}
                        </span>
                    </div>

                    <p class="text-gray-500 mt-4">
                        {{ order.items[0].name }}

                        <span v-if="order.items.length > 1" class="text-gray-500">
                            + {{ order.items.length - 1 }} more item(s)
                        </span>
                    </p>

                    <div class="flex justify-between items-center mt-4">
                        <p class="text-gray-500">
                            {{ order.date }}
                        </p>
                        <p class="text-[#1F3B2D] font-semibold">
                            {{ order.total }}
                        </p>
                    </div>

                    <div class="mt-4 pt-4 border-t border-gray-100">
                        <p class="text-sm text-gray-400">
                            {{ order.items.length }} item(s) • 
                            <span v-for="(item, idx) in order.items.slice(0, 2)" :key="idx" class="inline-block">
                                {{ item.name }}<span v-if="idx < Math.min(order.items.length, 2) - 1">, </span>
                            </span>
                            <span v-if="order.items.length > 2" class="text-gray-400">
                                + {{ order.items.length - 2 }} more
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            <div v-else class="mt-10 text-center py-10">
                <div class="text-6xl mb-4">🛒</div>
                <p class="text-gray-500 text-lg">
                    No orders found.
                </p>
                <p class="text-gray-400 text-sm mt-2">
                    Start shopping to see your order history here.
                </p>
                <router-link to="/shop" class="inline-block mt-6 px-8 py-3 bg-[#1F3B2D] text-white hover:bg-[#2C4D3A] transition-all duration-300 hover:scale-105 active:scale-95 uppercase tracking-[0.2em]">
                    Browse Collection
                </router-link>
            </div>
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

button:active {
    transform: scale(0.95);
}

.hover\:shadow-xl:hover {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
</style>