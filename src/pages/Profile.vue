<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'
import { setCurrency } from '../stores/currency'
import { authService } from '../api/authService'

let observer = null

const isOnline = ref(true)
const isPageLoading = ref(true)

const fullName = ref('')
const email = ref('')
const profileImage = ref('')
const password = ref('********')
const selectedCurrency = ref('USD')
const isLoading = ref(true)
const mobile = ref("")

function formatDate(date) {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    })
}

function getInitials(name) {
    if (!name) return 'U'
    const names = name.split(' ')
    if (names.length === 1) return names[0].charAt(0).toUpperCase()
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
}

const editedName = ref('')

const showEditModal = ref(false)
const showPasswordModal = ref(false)

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordError = ref('')

async function loadUserData() {
    isLoading.value = true
    try {
        const user = await authService.getCurrentUser()
        
        if (user) {
            if (user.first_name || user.last_name) {
                fullName.value = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'User'
            } else if (user.name) {
                fullName.value = user.name
            }
            
            email.value = user.email || ''
            editedName.value = fullName.value
            
            profileImage.value = user.avatar || ''
            
            mobile.value = user.mobile_number || ''
            
        }
    } catch (error) {
        console.error('Failed to load user data:', error)
    } finally {
        isLoading.value = false
    }
}

function saveCurrency(currency) {
    selectedCurrency.value = currency
    setCurrency(currency)
}

onMounted(async () => {
    isOnline.value = true
    
    await loadUserData()
    
    await nextTick()
    
    setTimeout(() => {
        isPageLoading.value = false
        setupObserver()
    }, 100)
})

onUnmounted(() => {
    if (observer) observer.disconnect()
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

async function saveProfile() {
    try {
        const names = editedName.value.trim().split(' ')

        const firstName = names.shift() || ''
        const lastName = names.join(' ')

        await authService.updateProfile({
            first_name: firstName,
            last_name: lastName
        })

        await loadUserData()

        showEditModal.value = false
    } catch (error) {
        console.error(error)
    }
}

async function changePassword() {
    passwordError.value = ''

    if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
        passwordError.value = 'Please fill in all fields'
        return
    }

    if (newPassword.value !== confirmPassword.value) {
        passwordError.value = 'Passwords do not match'
        return
    }

    if (newPassword.value.length < 6) {
        passwordError.value = 'Password must be at least 6 characters'
        return
    }

    try {
        const response = await authService.changePassword({
            oldPassword: currentPassword.value,
            newPassword: newPassword.value
        })
        
        password.value = '********'
        currentPassword.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
        passwordError.value = ''
        showPasswordModal.value = false
    } catch (error) {
        console.error('Failed to change password:', error)
        passwordError.value = error.message ?? 'Failed to change password. Please try again.'
    }
}

function closePasswordModal() {
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    passwordError.value = ''
    showPasswordModal.value = false
}
</script>

<template>
    <div v-if="!isPageLoading" class="animate-fadeIn">
        <section class="bg-[#F5F2EB] min-h-screen overflow-hidden">
            <div class="max-w-6xl mx-auto px-8 py-24">
                <div class="fade-in" style="opacity: 0; transform: translateY(40px); transition: all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
                    <p class="uppercase text-[#C6A769] text-sm tracking-[0.3em]">Account</p>
                    <h1 class="font-['Cormorant_Garamond'] text-6xl text-[#1F3B2D] mt-4">Settings</h1>
                    <p class="mt-6 text-gray-600 max-w-2xl">
                        Manage your personal information, security settings, and account preferences.
                    </p>
                </div>
            </div>

            <div class="max-w-6xl mx-auto px-8 pb-16">
                <div v-if="isLoading" class="flex justify-center items-center h-64">
                    <div class="text-xl text-[#1F3B2D]">Loading...</div>
                </div>

                <div v-else>
                    <div class="bg-white border border-gray-200 p-10 grid md:grid-cols-[300px_1fr] gap-10 shadow-sm rounded-sm fade-in"
                         style="opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s;">
                        <div class="flex flex-col items-center justify-center text-center">
                            <div class="w-28 h-28 rounded-full overflow-hidden border-2 border-[#C6A769] transition-transform duration-500 hover:scale-105">
                                <img v-if="profileImage" :src="profileImage" class="w-full h-full object-cover">
                                <div v-else class="w-full h-full flex items-center justify-center text-4xl text-[#1F3B2D] font-semibold bg-[#F5F2EB]">
                                    {{ getInitials(fullName) }}
                                </div>
                            </div>
                            <h3 class="mt-6 text-2xl text-[#1F3B2D] font-['Cormorant_Garamond']">{{ fullName }}</h3>
                            <p class="text-gray-500 mt-2">Member</p>
                            <button @click="showEditModal = true" class="mt-6 px-8 py-3 bg-[#1F3B2D] cursor-pointer text-white hover:bg-[#2C4D3A] transition-all duration-300 hover:scale-105 active:scale-95 uppercase tracking-[0.2em]">
                                Edit Profile
                            </button>
                        </div>

                        <div>
                            <h2 class="font-['Cormorant_Garamond'] text-4xl text-[#1F3B2D]">Account Information</h2>
                            <div class="mt-8 grid md:grid-cols-2 gap-8">
                                <div class="transition-all duration-300 hover:pl-2">
                                    <p class="text-gray-500 text-sm uppercase tracking-[0.2em]">Email Address</p>
                                    <p class="text-lg text-[#1F3B2D] mt-2">{{ email }}</p>
                                </div>
                                <div class="transition-all duration-300 hover:pFl-2">
                                    <p class="text-gray-500 text-sm uppercase tracking-[0.2em]">Mobile Number</p>
                                    <p class="text-lg text-[#1F3B2D] mt-2">{{ mobile || 'Not provided' }}</p>
                                </div>
                                <div class="transition-all duration-300 hover:pl-2">
                                    <p class="text-gray-500 text-sm uppercase tracking-[0.2em]">Account Type</p>
                                    <p class="text-lg text-[#1F3B2D] mt-2">Customer</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white border border-gray-200 shadow-sm rounded-sm mt-8 px-16 py-12 fade-in"
                         style="opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s;">
                        <h2 class="font-['Cormorant_Garamond'] text-4xl text-[#1F3B2D]">Security</h2>
                        <button @click="showPasswordModal = true" class="mt-6 px-8 py-3 bg-[#1F3B2D] cursor-pointer text-white hover:bg-[#2C4D3A] transition-all duration-300 hover:scale-105 active:scale-95 uppercase tracking-[0.2em] relative overflow-hidden group">
                            <span class="relative z-10">Change Password</span>
                            <span class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></span>
                        </button>
                    </div>

                    <div class="bg-white border border-gray-200 shadow-sm rounded-sm mt-8 px-16 py-12 fade-in"
                         style="opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s;">
                        <h2 class="font-['Cormorant_Garamond'] text-4xl text-[#1F3B2D]">Preferences</h2>
                        <div class="mt-10 space-y-8">

                            <div class="border-t pt-8">
                                <p class="text-gray-500 text-sm uppercase tracking-[0.2em]">Currency</p>
                                <div class="flex gap-3 mt-4">
                                    <button v-for="curr in ['USD', 'EUR', 'LBP']" :key="curr"
                                        @click="saveCurrency(curr)"
                                        :class="[
                                            'px-5 py-2 border transition-all duration-300 cursor-pointer',
                                            selectedCurrency === curr 
                                                ? 'bg-[#1F3B2D] text-white border-[#1F3B2D] scale-105 shadow-md' 
                                                : 'hover:border-[#C6A769] hover:scale-105 hover:shadow-md'
                                        ]">
                                        {{ curr }} {{ curr === 'USD' ? '$' : curr === 'EUR' ? '€' : '£' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div v-if="showEditModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
            <div class="bg-white w-[500px] p-10 rounded-sm transform transition-all duration-300 scale-100">
                <h3 class="font-['Cormorant_Garamond'] text-4xl text-[#1F3B2D]">Edit Profile</h3>
                <div class="mt-8 space-y-6">
                    <div class="flex flex-col items-center">
                        <div class="w-28 h-28 rounded-full overflow-hidden border-2 border-[#C6A769] transition-transform duration-500 hover:scale-105">
                            <img v-if="profileImage" :src="profileImage" class="w-full h-full object-cover">
                            <div v-else class="w-full h-full flex items-center justify-center text-4xl text-[#1F3B2D] font-semibold bg-[#F5F2EB]">
                                {{ getInitials(fullName) }}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm mb-2">Full Name</label>
                        <input v-model="editedName" type="text" class="w-full border px-4 py-3 focus:border-[#C6A769] focus:shadow-md outline-none transition-all duration-300 hover:border-[#C6A769]">
                    </div>
                </div>
                <div class="flex justify-end gap-4 mt-8">
                    <button @click="showEditModal = false" class="px-6 py-3 border cursor-pointer hover:border-[#C6A769] transition-all duration-300 hover:scale-105 active:scale-95">Cancel</button>
                    <button @click="saveProfile" class="px-6 py-3 bg-[#1F3B2D] text-white cursor-pointer hover:bg-[#2C4D3A] transition-all duration-300 hover:scale-105 active:scale-95">Save Changes</button>
                </div>
            </div>
        </div>

        <div v-if="showPasswordModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
            <div class="bg-white w-[500px] p-10 rounded-sm transform transition-all duration-300 scale-100">
                <h3 class="font-['Cormorant_Garamond'] text-4xl text-[#1F3B2D]">Change Password</h3>
                <div class="mt-8 space-y-6">
                    <div>
                        <label class="block text-sm mb-2">Current Password</label>
                        <div class="relative">
                            <input v-model="currentPassword" :type="showCurrentPassword ? 'text' : 'password'" class="w-full border px-4 py-3 pr-12 focus:border-[#C6A769] focus:shadow-md outline-none transition-all duration-300 hover:border-[#C6A769]">
                            <button type="button" @click="showCurrentPassword = !showCurrentPassword" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C6A769] transition-colors duration-300 cursor-pointer">
                                <Eye v-if="!showCurrentPassword" class="w-5 h-5" />
                                <EyeOff v-else class="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm mb-2">New Password</label>
                        <div class="relative">
                            <input v-model="newPassword" :type="showNewPassword ? 'text' : 'password'" class="w-full border px-4 py-3 pr-12 focus:border-[#C6A769] focus:shadow-md outline-none transition-all duration-300 hover:border-[#C6A769]">
                            <button type="button" @click="showNewPassword = !showNewPassword" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C6A769] transition-colors duration-300 cursor-pointer">
                                <Eye v-if="!showNewPassword" class="w-5 h-5" />
                                <EyeOff v-else class="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm mb-2">Confirm New Password</label>
                        <div class="relative">
                            <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" class="w-full border px-4 py-3 pr-12 focus:border-[#C6A769] focus:shadow-md outline-none transition-all duration-300 hover:border-[#C6A769]">
                            <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C6A769] transition-colors duration-300 cursor-pointer">
                                <Eye v-if="!showConfirmPassword" class="w-5 h-5" />
                                <EyeOff v-else class="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <p v-if="passwordError" class="text-red-500 text-sm animate-pulse">{{ passwordError }}</p>
                </div>

                <div class="flex justify-end gap-4 mt-8">
                    <button @click="closePasswordModal" class="px-6 py-3 border cursor-pointer hover:border-[#C6A769] transition-all duration-300 hover:scale-105 active:scale-95">Cancel</button>
                    <button @click="changePassword" class="px-6 py-3 bg-[#1F3B2D] text-white cursor-pointer hover:bg-[#2C4D3A] transition-all duration-300 hover:scale-105 active:scale-95">Save Password</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.fade-in {
    will-change: transform, opacity;
}

.fade-in.visible {
    opacity: 1 !important;
    transform: translate(0) scale(1) !important;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
}

button:active {
    transform: scale(0.95);
}

input {
    transition: all 0.3s ease;
}
</style>