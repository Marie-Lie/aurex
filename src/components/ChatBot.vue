<script setup>
import { ref, nextTick, computed } from 'vue'
import { MessageCircle, X, Send, Loader2 } from 'lucide-vue-next'
import { products } from '../data/products'
import { useRouter } from 'vue-router'

const router = useRouter()
const isOpen = ref(false)
const messageInput = ref('')
const chatContainer = ref(null)
const isTyping = ref(false)
const showSuggestions = ref(true)

const envKey = import.meta.env.VITE_DEEPSEEK_API_KEY
const apiKey = (envKey && envKey !== 'undefined' ? envKey : '').trim()

const isApiKeyConfigured = computed(() => {
    return apiKey.length > 10 // Basic check to ensure it's a real key
})

if (!apiKey) {
    console.warn("Aurex Chatbot: VITE_DEEPSEEK_API_KEY is missing. Check your .env file.")
}

const messages = ref([
    {
        id: 1,
        type: 'bot',
        text: isApiKeyConfigured.value ? "Hello! I'm your Aurex Assistant. How can I help you elevate your style today?" : "I'm sorry, my services are currently unavailable. Please check back later.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
])

const suggestions = [
    "Show me watches",
    "Clothing under $100",
    "New arrivals",
    "Shipping policy"
]

const scrollToBottom = async () => {
    await nextTick()
    if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
}

const handleSuggestion = (suggestion) => {
    messageInput.value = suggestion
    sendMessage()
}

// Create a compact string version of your products for the AI's context
const catalogContext = computed(() => {
    return products.map(p =>
        `ID: ${p.id}, Name: ${p.name}, Category: ${p.category}, Price: ${p.price}, Description: ${p.description}`
    ).join('\n')
})

// Extracting brand knowledge from the site structure
const brandKnowledge = {
    philosophy: "Style is not about trends; it's about confidence. Aurex combines timeless craftsmanship with contemporary design.",
    shipping: "Standard: 3-7 days (Free over $150). Express: 1-3 days. International: 7-14 days.",
    returns: "30-day return policy. Items must be unworn and in original packaging.",
    audience: "Modern gentlemen, young professionals, and fashion enthusiasts."
}

const parseProductIds = (text) => {
    const matches = text.match(/\[?ID: (\d+)\]?/gi)
    if (!matches) return []

    const ids = [...new Set(matches.map(m => parseInt(m.match(/\d+/)[0])))]
    return products.filter(p => ids.includes(p.id))
}

const sendMessage = async () => {
    if (!isApiKeyConfigured.value) {
        messages.value.push({
            id: Date.now(),
            type: 'bot',
            text: "I cannot process your request because my services are currently unavailable. Please ensure the API key is correctly configured.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })
        await scrollToBottom()
        return
    }

    if (!messageInput.value.trim()) return

    const userQuery = messageInput.value
    showSuggestions.value = false

    messages.value.push({
        id: Date.now(),
        type: 'user',
        text: userQuery,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })

    messageInput.value = ''
    await scrollToBottom()

    isTyping.value = true
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey,
                'HTTP-Referer': window.location.origin, // Optional for OpenRouter
                'X-Title': 'Aurex E-commerce'         // Optional for OpenRouter
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat', // Format for OpenRouter
                messages: [
                    {
                        role: 'system',
                        content: `You are the Aurex Concierge, a world-class personal stylist. 
                        
                        Brand Philosophy: ${brandKnowledge.philosophy}
                        Policies: Shipping: ${brandKnowledge.shipping}, Returns: ${brandKnowledge.returns}
                        Catalog:
                        ${catalogContext.value}

                        STRICT GUIDELINES:
                        1. BE CONCISE: Get straight to the point. No fluffy introductions.
                        2. PRODUCT TAGS: You MUST include product IDs in this format: [ID: X] when recommending items.
                        3. STYLE: Act as a professional stylist. Suggest matching pieces to complete a look.`
                    },
                    ...messages.value.map(m => ({
                        role: m.type === 'user' ? 'user' : 'assistant',
                        content: m.text
                    }))
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || `Status ${response.status}`;

            if (response.status === 401) {
                throw new Error("Authentication failed: Your API key is invalid. Please check your .env file and restart the dev server.");
            }
            throw new Error(`DeepSeek API error: ${errorMessage}`);
        }

        const data = await response.json()
        const responseText = data.choices[0].message.content

        // Extract products mentioned by looking for our [ID: x] pattern
        const foundProducts = parseProductIds(responseText)

        // Clean the text to remove the technical [ID: x] markers from the UI
        const cleanText = responseText.replace(/\[ID: \d+\]/g, '').trim()

        messages.value.push({
            id: Date.now(),
            type: 'bot',
            text: cleanText,
            products: foundProducts,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })
    } catch (error) {
        console.error("DeepSeek API Error:", error)
        messages.value.push({
            id: Date.now(),
            type: 'bot',
            text: error.message.includes('Authentication') ? error.message : "I apologize, but I encountered an error while processing your request. Please try again.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })
    } finally {
        isTyping.value = false
        await scrollToBottom()
    }
}

const formatMessage = (text) => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
}

const navigateToProduct = (id) => {
    isOpen.value = false
    router.push(`/product/${id}`)
}
</script>

<template>
    <div class="fixed bottom-8 right-8 z-[100] font-sans">
        <!-- Chat Toggle Button -->
        <button @click="isOpen = !isOpen"
            class="bg-[#1F3B2D] cursor-pointer hover:bg-[#2C4D3A] text-[#C6A769] p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group">
            <MessageCircle v-if="!isOpen" class="w-7 h-7" />
            <X v-else class="w-7 h-7" />
        </button>

        <!-- Chat Window -->
        <Transition enter-active-class="transition duration-500 ease-in-out"
            enter-from-class="opacity-0 translate-y-10 scale-95" enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-300 ease-in-out"
            leave-from-class="opacity-100 translate-y-0 scale-100" leave-to-class="opacity-0 translate-y-10 scale-95">
            <div v-if="isOpen"
                class="absolute bottom-20 right-0 w-[90vw] md:w-[420px] h-[650px] max-h-[75vh] bg-[#F5F2EB]/95 backdrop-blur-xl border border-[#C6A769]/30 shadow-2xl flex flex-col overflow-hidden rounded-2xl">
                <!-- Header -->
                <div class="bg-[#1F3B2D] p-5 flex items-center gap-4">
                    <div
                        class="size-10 bg-[#C6A769] rounded-full flex items-center justify-center text-[#1F3B2D] font-bold shadow-inner">
                        A
                    </div>
                    <div>
                        <h3 class="text-white font-['Cormorant_Garamond'] text-2xl leading-none">Aurex Concierge</h3>
                        <p class="text-[#C6A769] text-[10px] uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5">
                            <span class="size-1.5 bg-[#C6A769] rounded-full animate-pulse"></span>
                            Personal Stylist Online
                        </p>
                    </div>
                </div>

                <!-- Messages Area -->
                <div ref="chatContainer" class="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                    <div v-for="msg in messages" :key="msg.id"
                        :class="['flex flex-col', msg.type === 'user' ? 'items-end' : 'items-start']">

                        <!-- BOT MESSAGE -->
                        <div v-if="msg.type === 'bot'" class="flex gap-3 items-start max-w-full">
                            <div class="size-8 rounded-full bg-[#1F3B2D] text-[#C6A769]
                                flex items-center justify-center text-xs font-bold flex-shrink-0">
                                A
                            </div>

                            <div class="bg-gradient-to-br from-white to-[#F8F4EC]
                                border border-[#C6A769]/20
                                rounded-2xl rounded-tl-none
                                p-4 shadow-lg max-w-[85%]">

                                <p class="text-[#1F3B2D] leading-relaxed whitespace-pre-wrap"
                                    v-html="formatMessage(msg.text)"></p>

                                <!-- Recommended Pieces -->
                                <div v-if="msg.products?.length" class="mt-5 border-t border-[#C6A769]/20 pt-4">

                                    <p class="text-[10px] uppercase tracking-[0.25em] text-[#C6A769] mb-3">
                                        Recommended Pieces
                                    </p>

                                    <div class="space-y-3">
                                        <div v-for="prod in msg.products" :key="prod.id"
                                            @click="navigateToProduct(prod.id)" class="flex items-center gap-3 p-3
                                            bg-white hover:bg-[#FDFBF8]
                                            rounded-xl cursor-pointer
                                            transition-all duration-300
                                            border border-[#C6A769]/10
                                            hover:border-[#C6A769]/40
                                            hover:shadow-md">
                                            <img :src="prod.image" class="w-20 h-20 rounded-xl object-cover">
                                            <div class="flex-1">
                                                <p class="font-medium text-[#1F3B2D]">
                                                    {{ prod.name }}
                                                </p>
                                                <p class="text-xs text-gray-500">
                                                    {{ prod.category }}
                                                </p>
                                                <p class="text-[#C6A769] font-bold mt-1">
                                                    {{ prod.price }}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- USER MESSAGE -->
                        <div v-else class="max-w-[85%] p-4 rounded-2xl rounded-tr-none
                            bg-[#1F3B2D] text-white shadow-sm">
                            {{ msg.text }}
                        </div>

                        <!-- TIMESTAMP -->
                        <span class="text-[9px] text-gray-400 mt-2 uppercase tracking-[0.1em]">
                            {{ msg.timestamp }}
                        </span>
                    </div>

                    <!-- Typing Indicator -->
                    <div v-if="isTyping"
                        class="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-gray-100">
                        <div class="flex gap-1">
                            <span class="size-1.5 bg-[#C6A769] rounded-full animate-bounce"></span>
                            <span
                                class="size-1.5 bg-[#C6A769] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span
                                class="size-1.5 bg-[#C6A769] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                        <span class="text-xs italic text-gray-500 font-serif">Aurex is curating your response...</span>
                    </div>

                    <!-- Suggestions -->
                    <div v-if="showSuggestions" class="pt-2 flex flex-wrap gap-2">
                        <button v-for="s in suggestions" :key="s" @click="handleSuggestion(s)"
                            class="text-[11px] uppercase tracking-widest bg-white border border-[#C6A769]/30 text-[#1F3B2D] px-4 py-2 rounded-full cursor-pointer hover:bg-[#1F3B2D] hover:text-[#C6A769] transition-all duration-500 shadow-sm">
                            {{ s }}
                        </button>
                    </div>
                </div>

                <!-- Input Area -->
                <div class="p-6 bg-white border-t border-gray-100">
                    <div class="relative flex items-center">
                        <input v-model="messageInput" @keyup.enter="sendMessage" type="text"
                            placeholder="Ask about a collection..." :disabled="!isApiKeyConfigured"
                            class="w-full bg-[#F5F2EB] border-none rounded-full py-4 px-6 pr-14 text-sm focus:ring-1 focus:ring-[#C6A769] outline-none transition-all placeholder:italic disabled:opacity-50 disabled:cursor-not-allowed">
                        <button @click="sendMessage" :disabled="!messageInput.trim() || !isApiKeyConfigured"
                            class="absolute right-2 p-2 text-[#1F3B2D] cursor-pointer hover:text-[#C6A769] disabled:opacity-30 transition-colors">
                            <Send class="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
/* Custom scrollbar for chat */
::-webkit-scrollbar {
    width: 4px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: #E5E7EB;
    border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
    background: #C6A769;
}

@media (max-width: 768px) {
    .fixed {
        bottom: 1rem;
        right: 1rem;
    }

    div[v-if="isOpen"] {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        max-height: 100vh;
        border-radius: 0;
        bottom: 0;
    }
}
</style>