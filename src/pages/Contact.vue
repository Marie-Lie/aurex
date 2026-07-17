<script setup>
import { onMounted, onUnmounted, nextTick, ref } from 'vue'
import { authService } from '../api/authService'
import { contactService } from '../api/contactService'

let observer = null
const formData = ref({
    first_name: '',
    last_name: '',
    email: '',
    subject: '',
    message: '',
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

async function autofillUserInfo() {
    try {
        const user = await authService.getCurrentUser()

        if (!user) return

        formData.value.first_name = user.first_name || ''
        formData.value.last_name = user.last_name || ''
        formData.value.email = user.email || ''
    } catch (error) {
        console.error('Failed to load user information:', error)
    }
}

async function handleSubmit() {
    try {
        await contactService.sendMessage(formData.value)

        alert('Message sent successfully!')

        const firstName = formData.value.first_name
        const lastName = formData.value.last_name
        const email = formData.value.email

        formData.value = {
            first_name: firstName,
            last_name: lastName,
            email: email,
            subject: '',
            message: ''
        }
    } catch (error) {
        console.error(error)
        alert('Failed to send message.')
    }
}

onMounted(async () => {
    setupObserver()
    await autofillUserInfo()
})

onUnmounted(() => {
    if (observer) observer.disconnect()
})
</script>

<template>
    <section class="bg-[#F5F2EB] overflow-hidden">
        <div class="grid lg:grid-cols-2 min-h-screen">
            <div class="fade-in"
                 style="opacity: 0; transform: translateX(-40px); transition: all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
                <img
                    src="/assets/images/contact.avif"
                    alt="AUREX Contact"
                    class="w-full h-full min-h-screen object-cover transition-transform duration-10000 hover:scale-105"
                >
            </div>

            <div class="bg-[#F5F2EB] px-16 py-20">
                <div class="fade-in"
                     style="opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
                    <p class="uppercase tracking-[0.3em] text-[#C6A769] text-sm">
                        Get In Touch
                    </p>

                    <h1 class="font-['Cormorant_Garamond'] text-[#1F3B2D] text-6xl leading-tight mt-6">
                        Need Assistance?
                    </h1>

                    <p class="text-gray-600 text-lg leading-relaxed mt-8 max-w-xl">
                        Our support team is here to help with orders,
                        returns, sizing questions, and account inquiries.
                    </p>
                </div>

                <div class="mt-16 space-y-10 fade-in"
                     style="opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s;">
                    <div class="group">
                        <label class="uppercase tracking-[0.2em] text-sm text-gray-500 transition-colors duration-300 group-focus-within:text-[#C6A769]">
                            First Name
                        </label>

                        <input
                            v-model="formData.first_name"
                            type="text"
                            placeholder="Enter first name"
                            class="w-full bg-transparent border-b border-gray-300 py-4 text-[#1F3B2D] focus:outline-none focus:border-[#C6A769] transition-all duration-300 hover:border-[#C6A769]"
                        >
                    </div>

                    <div class="group">
                        <label class="uppercase tracking-[0.2em] text-sm text-gray-500 transition-colors duration-300 group-focus-within:text-[#C6A769]">
                            Last Name
                        </label>

                        <input
                            v-model="formData.last_name"
                            type="text"
                            placeholder="Enter last name"
                            class="w-full bg-transparent border-b border-gray-300 py-4 text-[#1F3B2D] focus:outline-none focus:border-[#C6A769] transition-all duration-300 hover:border-[#C6A769]"
                        >
                    </div>

                    <div class="group">
                        <label class="uppercase tracking-[0.2em] text-sm text-gray-500 transition-colors duration-300 group-focus-within:text-[#C6A769]">
                            Email
                        </label>

                        <input
                            v-model="formData.email"
                            type="email"
                            placeholder="Enter email address"
                            class="w-full bg-transparent border-b border-gray-300 py-4 text-[#1F3B2D] focus:outline-none focus:border-[#C6A769] transition-all duration-300 hover:border-[#C6A769]"
                        >
                    </div>

                    <div class="group">
                        <label class="uppercase tracking-[0.2em] text-sm text-gray-500 transition-colors duration-300 group-focus-within:text-[#C6A769]">
                            Subject
                        </label>

                        <input
                            v-model="formData.subject"
                            type="text"
                            placeholder="Enter subject"
                            class="w-full bg-transparent border-b border-gray-300 py-4 text-[#1F3B2D] focus:outline-none focus:border-[#C6A769] transition-all duration-300 hover:border-[#C6A769]"
                        >
                    </div>

                    <div class="group">
                        <label class="uppercase tracking-[0.2em] text-sm text-gray-500 transition-colors duration-300 group-focus-within:text-[#C6A769]">
                            Message
                        </label>

                        <textarea
                            v-model="formData.message"
                            rows="5"
                            placeholder="How can we help you?"
                            class="w-full bg-transparent border-b border-gray-300 py-4 text-[#1F3B2D] resize-none focus:outline-none focus:border-[#C6A769] transition-all duration-300 hover:border-[#C6A769]"
                        ></textarea>
                    </div>

                    <button
                        @click="handleSubmit"
                        class="bg-[#1F3B2D] text-white px-12 py-4 uppercase tracking-[0.2em] transition-all duration-300 hover:bg-[#2C4D3A] hover:scale-105 hover:shadow-2xl active:scale-95 cursor-pointer relative overflow-hidden group"
                    >
                        <span class="relative z-10">Send Message</span>
                        <span class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></span>
                    </button>
                </div>

                <div class="border-t border-gray-300 mt-16 pt-10 grid md:grid-cols-2 gap-10 fade-in"
                     style="opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s;">
                    <div>
                        <h3 class="uppercase tracking-[0.2em] text-sm text-gray-500">
                            Customer Support
                        </h3>

                        <div class="mt-4 text-gray-600 space-y-2">

                            <p>Response Time: Within 1 Business Day</p>
                            <p>Monday – Friday</p>
                        </div>
                    </div>
                </div>
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

.hover\:shadow-2xl:hover {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

button:active {
    transform: scale(0.95);
}

img {
    transition: all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

input, select, textarea {
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

input:focus, select:focus, textarea:focus {
    transform: translateY(-2px);
}
</style>