<script setup>
import { Trash2, Eye, EyeOff } from 'lucide-vue-next'
import ChatBot from './ChatBot.vue'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { wishlist } from '../stores/wishlist'
import { formatPrice } from '../stores/currency'
import {
    cart,
    fetchCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    cartLoading
} from '../stores/cart'
import { authService } from '../api/authService'

const router = useRouter()
const showSearch = ref(false)

const showCart = ref(false)
const showAuthModal = ref(false)
const isLoginMode = ref(false)
const showAccountDetails = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const showUserMenu = ref(false)
const isLoading = ref(false)

const showForgotPasswordModal = ref(false)
const forgotPasswordEmail = ref('')
const forgotPasswordError = ref('')
const forgotPasswordLoading = ref(false)

const showResetPasswordModal = ref(false)

const resetEmail = ref('')
const resetCode = ref('')
const resetNewPassword = ref('')
const resetConfirmPassword = ref('')

const resetPasswordError = ref('')
const resetPasswordLoading = ref(false)

const showOTPModal = ref(false)
const otpCode = ref('')
const otpEmail = ref('')
const otpError = ref('')
const otpLoading = ref(false)
const otpResendLoading = ref(false)
const otpResendSuccess = ref(false)

const isLoggedIn = ref(false)
const fullName = ref('')
const email = ref('')
const profileImage = ref('')
const isLoadingUser = ref(true)

const emailError = ref('')
const password = ref('')
const confirmPassword = ref('')
const passwordError = ref('')

const loginEmail = ref('')
const loginPassword = ref('')
const loginError = ref('')
const loginPasswordError = ref('')

const firstName = ref('')
const lastName = ref('')
const mobile = ref('+961')

const searchQuery = ref('')

const cartCount = computed(() => {
    return cart.value.reduce(
        (total, item) => total + item.quantity,
        0
    )
})

watch(cart, () => {
}, { deep: true })

const cartTotal = computed(() => {
    return cart.value.reduce((total, item) => {
        return total + (item.price * item.quantity)
    }, 0)
})

function continueSignup() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email.value) {
        emailError.value = 'Please enter your email address'
        return
    }

    if (!emailPattern.test(email.value)) {
        emailError.value = 'Please enter a valid email address'
        return
    }

    emailError.value = ''
    showAccountDetails.value = true
}

async function sendOTP() {
    otpError.value = ''
    otpResendSuccess.value = false
    otpResendLoading.value = true
    
    try {
        const emailToUse = otpEmail.value || email.value
        await authService.resendOTP(emailToUse)
        otpResendSuccess.value = true
        setTimeout(() => {
            otpResendSuccess.value = false
        }, 5000)
    } catch (error) {
        console.error('Failed to send OTP:', error)
        otpError.value = 'Failed to send verification code. Please try again.'
    } finally {
        otpResendLoading.value = false
    }
}

async function forgotPassword() {
    forgotPasswordError.value = ''
    forgotPasswordLoading.value = true

    try {
        await authService.forgotPassword(forgotPasswordEmail.value)

        resetEmail.value = forgotPasswordEmail.value

        showForgotPasswordModal.value = false
        showResetPasswordModal.value = true

    } catch (error) {
        forgotPasswordError.value =
            error.message || 'Failed to send reset code.'
    } finally {
        forgotPasswordLoading.value = false
    }
}

async function resetPassword() {
    resetPasswordError.value = ''

    if (!resetCode.value || !resetNewPassword.value || !resetConfirmPassword.value) {
        resetPasswordError.value = 'Please fill in all fields.'
        return
    }

    if (resetNewPassword.value !== resetConfirmPassword.value) {
        resetPasswordError.value = 'Passwords do not match.'
        return
    }

    try {
        await authService.resetPassword({
            email: resetEmail.value,
            code: resetCode.value,
            newPassword: resetNewPassword.value
        })

        resetResetPasswordForm()
        resetForgotPasswordForm()

        showResetPasswordModal.value = false
        showAuthModal.value = true
        isLoginMode.value = true

    } catch (error) {
        resetPasswordError.value =
            error.message || 'Failed to reset password.'
    }
}

async function verifyOTP() {
    if (!otpCode.value || otpCode.value.length < 4) {
        otpError.value = 'Please enter the verification code'
        return
    }
    
    otpLoading.value = true
    otpError.value = ''
    
    try {
        const emailToUse = otpEmail.value || email.value
        const response = await authService.verifyOTP(emailToUse, otpCode.value)
        
        showOTPModal.value = false
        otpCode.value = ''
        
        const savedPassword = localStorage.getItem('tempPassword')
        if (savedPassword && emailToUse) {
            try {
                const credentials = {
                    email: emailToUse,
                    password: savedPassword,
                    deviceName: 'web-browser',
                    deviceId: authService.generateDeviceId()
                }
                const loginResponse = await authService.login(credentials)
                
                const user = await authService.getCurrentUser()
                isLoggedIn.value = true
                fullName.value = user?.first_name && user?.last_name 
                    ? `${user.first_name} ${user.last_name}` 
                    : 'User'
                email.value = user?.email || emailToUse
                
                showAuthModal.value = false
                resetAuthForm()
                await fetchCart()
                
                localStorage.removeItem('tempPassword')
            } catch (loginError) {
                console.error('Auto-login failed:', loginError)
                showOTPModal.value = false
                showAuthModal.value = true
                isLoginMode.value = true
                loginEmail.value = emailToUse
                loginError.value = 'Verification successful! Please sign in.'
            }
        }
        
        showOTPModal.value = false
        
    } catch (error) {
        console.error('OTP verification failed:', error)
        otpError.value = error.message || 'Invalid verification code. Please try again.'
    } finally {
        otpLoading.value = false
    }
}

function closeOTPModal() {
    showOTPModal.value = false
    otpCode.value = ''
    otpError.value = ''
    otpResendSuccess.value = false
    showAuthModal.value = true
    isLoginMode.value = true
}

async function createAccount() {
    passwordError.value = ''
    isLoading.value = true

    if (!firstName.value.trim()) {
        passwordError.value = 'Please enter your first name'
        isLoading.value = false
        return
    }

    if (!lastName.value.trim()) {
        passwordError.value = 'Please enter your last name'
        isLoading.value = false
        return
    }

    if (!password.value) {
        passwordError.value = 'Please enter a password'
        isLoading.value = false
        return
    }

    if (password.value.length < 6) {
        passwordError.value = 'Password must be at least 6 characters'
        isLoading.value = false
        return
    }
    
    if (password.value !== confirmPassword.value) {
        passwordError.value = 'Passwords do not match'
        isLoading.value = false
        return
    }

    try {
        const userData = {
            firstName: firstName.value,
            lastName: lastName.value,
            email: email.value,
            password: password.value,
            mobile: mobile.value
        }

        const response = await authService.register(userData)

        localStorage.setItem('tempPassword', password.value)
        
        showAccountDetails.value = false
        showAuthModal.value = false
        showOTPModal.value = true
        otpEmail.value = email.value
        
        await sendOTP()

    } catch (error) {
        console.error('Registration failed:', error)
        passwordError.value = error.message || 'Registration failed. Please try again.'
    } finally {
        isLoading.value = false
    }
}

async function signIn() {
    loginError.value = ''
    loginPasswordError.value = ''
    isLoading.value = true

    if (!loginEmail.value) {
        loginError.value = 'Please enter your email'
        isLoading.value = false
        return
    }

    if (!loginPassword.value) {
        loginPasswordError.value = 'Please enter your password'
        isLoading.value = false
        return
    }

    try {
        const credentials = {
            email: loginEmail.value,
            password: loginPassword.value,
            deviceName: 'web-browser',
            deviceId: authService.generateDeviceId()
        }

        const response = await authService.login(credentials)

        const user = await authService.getCurrentUser()
        isLoggedIn.value = true
        fullName.value = user?.first_name && user?.last_name 
            ? `${user.first_name} ${user.last_name}` 
            : 'User'
        email.value = user?.email || loginEmail.value

        showAuthModal.value = false
        resetAuthForm()
        await fetchCart()

    } catch (error) {
        console.error('Login failed:', error)
        
        if (error.message === 'VERIFICATION_REQUIRED' || 
            error.message?.toLowerCase().includes('verify') ||
            error.message?.toLowerCase().includes('not verified')) {
            showAuthModal.value = false
            showOTPModal.value = true
            otpEmail.value = loginEmail.value
            localStorage.setItem('tempPassword', loginPassword.value)
            loginError.value = ''
            await sendOTP()
        } else {
            loginError.value = error.message || 'Invalid email or password'
        }
    } finally {
        isLoading.value = false
    }
}

async function logout() {
    try {
        await authService.logout()
        isLoggedIn.value = false
        showUserMenu.value = false
        fullName.value = ''
        email.value = ''
        cart.value = []
        
        router.push('/')
    } catch (error) {
        console.error('Logout error:', error)
        localStorage.removeItem('authToken')
        localStorage.removeItem('isLoggedIn')
        isLoggedIn.value = false
        showUserMenu.value = false
        fullName.value = ''
        email.value = ''
        cart.value = []
        
        router.push('/')
    }
}

function resetAuthForm() {
    firstName.value = ''
    lastName.value = ''
    email.value = ''
    fullName.value = ''
    password.value = ''
    confirmPassword.value = ''
    loginEmail.value = ''
    loginPassword.value = ''
    emailError.value = ''
    passwordError.value = ''
    loginError.value = ''
    loginPasswordError.value = ''
    showPassword.value = false
    showConfirmPassword.value = false
    mobile.value = '+961'
}

function openSignIn() {
    resetAuthForm()
    showAuthModal.value = true
    isLoginMode.value = true
    showAccountDetails.value = false
}

function openSignUp() {
    resetAuthForm()
    showAuthModal.value = true
    isLoginMode.value = false
    showAccountDetails.value = false
}

function toggleAuthMode() {
    resetAuthForm()
    isLoginMode.value = !isLoginMode.value
    showAccountDetails.value = false
}

function resetForgotPasswordForm() {
    forgotPasswordEmail.value = ''
    forgotPasswordError.value = ''
    forgotPasswordLoading.value = false
}

function resetResetPasswordForm() {
    resetEmail.value = ''
    resetCode.value = ''
    resetNewPassword.value = ''
    resetConfirmPassword.value = ''
    resetPasswordError.value = ''
    resetPasswordLoading.value = false
}

function handleSearch() {
    const search = searchQuery.value
        .trim()
        .toLowerCase()

    if (!search) return

    const pageSearch = {
        about: '/About',
        company: '/About',
        story: '/About',
        contact: '/Contact',
        support: '/Contact',
        help: '/Contact',
        profile: '/Profile',
        account: '/Profile',
        settings: '/Profile',
        orders: '/OrderHistory',
        order: '/OrderHistory',
        history: '/OrderHistory',
        tracking: '/OrderHistory',
        shipment: '/ShippingReturns',
        return: '/ShippingReturns',
        refund: '/ShippingReturns',
        delivery: '/ShippingReturns',
        faq: '/ShippingReturns'
    }

    if (pageSearch[search]) {
        router.push(pageSearch[search])
    }
    else {
        router.push({
            path: '/shop',
            query: {
                search
            }
        })
    }

    searchQuery.value = ''
    showSearch.value = false
}

async function checkAuth() {
    isLoadingUser.value = true
    
    if (authService.isAuthenticated()) {
        try {
            const user = await authService.getCurrentUser()
            if (user) {
                isLoggedIn.value = true
                fullName.value = user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name}` 
                    : user.name || 'User'
                email.value = user.email || ''
                profileImage.value = user.avatar || user.profile_image || ''
            } else {
                localStorage.removeItem('authToken')
                localStorage.removeItem('isLoggedIn')
                isLoggedIn.value = false
            }
        } catch (error) {
            console.error('Failed to load user:', error)
            isLoggedIn.value = false
        }
    } else {
        isLoggedIn.value = false
    }
    isLoadingUser.value = false
}

onMounted(async () => {
    await fetchCart()
    await checkAuth()
})

onUnmounted(() => {})
</script>

<template>
    <header class="bg-[#1f3b2d] text-white sticky top-0 z-50 shadow-lg">
        <nav class="flex justify-between items-center px-6 py-4">
            <div class="flex items-center gap-1 group">
                <img src="/assets/images/Aurex_logo_icon.png" alt="Aurex Logo Icon" class="h-10 transition-transform duration-500 group-hover:rotate-[-10deg]">
                <img src="/assets/images/Aurex_logo_text.png" alt="Aurex Logo Text" class="h-8 transition-opacity duration-500 group-hover:opacity-80">
            </div>

            <ul class="flex gap-10">
                <router-link class="relative hover:text-[#C6A769] cursor-pointer transition duration-300 after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-[#C6A769] after:transition-all after:duration-300 hover:after:w-full" to="/">Home</router-link>
                <router-link class="relative hover:text-[#C6A769] cursor-pointer transition duration-300 after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-[#C6A769] after:transition-all after:duration-300 hover:after:w-full" to="/shop">Shop</router-link>
                <router-link class="relative hover:text-[#C6A769] cursor-pointer transition duration-300 after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-[#C6A769] after:transition-all after:duration-300 hover:after:w-full" to="/About">About</router-link>
                <router-link class="relative hover:text-[#C6A769] cursor-pointer transition duration-300 after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-[#C6A769] after:transition-all after:duration-300 hover:after:w-full" to="/Contact">Contact</router-link>
            </ul>

            <div class="flex items-center gap-6">
                <div v-if="!isLoggedIn">
                    <div @click="openSignUp()"
                        class="flex items-center gap-6 px-5 py-2.5 border cursor-pointer border-[#C6A769] text-[#C6A769] hover:bg-[#C6A769] hover:text-black transition-all duration-300 hover:scale-105 active:scale-95">
                        Sign Up
                    </div>
                </div>

                <div class="flex items-center gap-5">
                    <div class="relative">
                        <img src="/assets/icons/search.svg"
                            class="h-5 invert cursor-pointer transition-all duration-300 hover:scale-110 hover:opacity-70"
                            @click="showSearch = !showSearch">

                        <Transition enter-active-class="transition-all duration-300 ease-out"
                            enter-from-class="opacity-0 scale-95 -translate-y-2"
                            enter-to-class="opacity-100 scale-100 translate-y-0"
                            leave-active-class="transition-all duration-200 ease-in"
                            leave-from-class="opacity-100 scale-100 translate-y-0"
                            leave-to-class="opacity-0 scale-95 -translate-y-2">

                            <div v-if="showSearch" class="absolute top-10 right-0 z-50">
                                <input
                                    v-model="searchQuery"
                                    @keyup.enter="handleSearch"
                                    @blur="setTimeout(() => showSearch = false, 200)"
                                    placeholder="Search..."
                                    class="w-72 px-4 py-3 bg-[#F5F2EB] text-[#1F3B2D] border border-[#C6A769] rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-[#C6A769] focus:ring-opacity-50 placeholder:text-gray-500 transition-all duration-300"
                                    autofocus
                                >
                            </div>
                        </Transition>
                    </div>

                    <div v-if="isLoggedIn" class="relative">
                        <img src="/assets/icons/user.svg"
                            class="h-5 invert cursor-pointer transition-all duration-300 hover:scale-110 hover:opacity-70"
                            @click="showUserMenu = !showUserMenu">

                        <Transition enter-active-class="transition-all duration-300 ease-out"
                            enter-from-class="opacity-0 scale-95 -translate-y-2"
                            enter-to-class="opacity-100 scale-100 translate-y-0"
                            leave-active-class="transition-all duration-200 ease-in"
                            leave-from-class="opacity-100 scale-100 translate-y-0"
                            leave-to-class="opacity-0 scale-95 -translate-y-2">

                            <div
                                v-if="showUserMenu"
                                class="absolute top-10 right-0 w-80 bg-white text-black shadow-xl border border-gray-200 z-50 rounded-lg overflow-hidden"
                            >
                                <button
                                    @click.stop="showUserMenu = false"
                                    class="absolute top-4 right-4 text-[#1F3B2D] cursor-pointer hover:text-[#C6A769] transition duration-300 text-lg font-light z-10"
                                >
                                    ✕
                                </button>

                                <div class="p-5 border-b flex items-center gap-5 bg-[#F8F6F1]">
                                    <div class="size-12 rounded-full overflow-hidden border-2 border-[#C6A769] flex-shrink-0 transition-transform duration-300 hover:scale-105">
                                        <img v-if="profileImage" :src="profileImage" alt="Profile Picture" class="w-full h-full object-cover">
                                        <div v-else class="w-full h-full flex items-center justify-center text-[#1F3B2D] font-semibold bg-[#F5F2EB]">
                                            {{ fullName.split(' ').map(name => name.charAt(0)).join('') }}
                                        </div>
                                    </div>

                                    <div>
                                        <p class="font-semibold text-[#1F3B2D]">{{ fullName }}</p>
                                        <p class="text-sm text-gray-500 mt-1">{{ email }}</p>
                                    </div>
                                </div>

                                <div class="p-2">
                                    <router-link to="/Profile" class="block w-full px-3 py-3 rounded-md hover:bg-[#F5F2EB] transition duration-300 hover:translate-x-1" @click="showUserMenu = false">
                                        Profile & Settings
                                    </router-link>
                                    <router-link to="/OrderHistory" class="block w-full px-3 py-3 rounded-md hover:bg-[#F5F2EB] transition duration-300 hover:translate-x-1" @click="showUserMenu = false">
                                        Order Tracking & History
                                    </router-link>
                                    <router-link to="/Wishlist" class="block w-full px-3 py-3 rounded-md hover:bg-[#F5F2EB] transition duration-300 hover:translate-x-1" @click="showUserMenu = false">
                                        Wishlist
                                        <span class="text-[#C6A769] font-semibold">({{ wishlist.length }})</span>
                                    </router-link>
                                </div>

                                <div class="border-t p-2 bg-[#F8F6F1]">
                                    <button @click="logout()" class="w-full px-3 py-3 text-red-500 hover:bg-red-50 rounded-md transition duration-300 cursor-pointer hover:translate-x-1">
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        </Transition>
                    </div>

                    <div class="relative">
                        <div class="cursor-pointer group" @click="showCart = !showCart">
                            <img src="/assets/icons/shopping-cart.svg" class="h-5 invert transition-all duration-300 group-hover:scale-110 group-hover:opacity-70">
                            <span class="absolute -top-2 -right-3 bg-[#C6A769] text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                                {{ cartCount }}
                            </span>
                        </div>

                        <Transition enter-active-class="transition-all duration-500 ease-out"
                            enter-from-class="opacity-0 scale-95 translate-y-4"
                            enter-to-class="opacity-100 scale-100 translate-y-0"
                            leave-active-class="transition-all duration-300 ease-in"
                            leave-from-class="opacity-100 scale-100 translate-y-0"
                            leave-to-class="opacity-0 scale-95 translate-y-4">

                            <div v-if="showCart" class="absolute top-10 right-0 w-96 bg-white text-black shadow-xl border border-gray-200 z-50 rounded-lg max-h-[80vh] overflow-y-auto">
                                <div class="p-4 border-b flex justify-between items-center bg-[#F8F6F1] rounded-t-lg sticky top-0 z-10">
                                    <h3 class="text-sm uppercase tracking-widest text-[#1F3B2D]">Shopping Bag</h3>
                                    <button @click.stop="showCart = false" class="text-[#1F3B2D] cursor-pointer hover:text-[#C6A769] transition duration-300 text-lg font-light">
                                        ✕
                                    </button>
                                </div>

                                <div v-if="cartLoading" class="p-8 text-center text-gray-500">
                                    Loading...
                                </div>

                                <div v-else-if="cart.length === 0" class="p-8 text-center text-gray-500">
                                    <div class="text-4xl mb-3">🛒</div>
                                    Your bag is empty.
                                </div>

                                <div v-for="item in cart" :key="item.id + item.selectedSize" class="p-4 border-b hover:bg-[#F8F6F1] transition duration-300">
                                    <div class="flex gap-4">
                                        <img :src="item.image" :alt="item.name" class="w-20 h-20 object-cover border border-gray-200 rounded-md transition-transform duration-300 hover:scale-105">
                                        <div class="flex-1">
                                            <p class="font-medium text-[#1F3B2D]">{{ item.name }}</p>
                                            <p v-if="item.selectedSize" class="text-sm text-gray-500">Size: {{ item.selectedSize }}</p>
                                            <p class="text-[#C6A769] font-medium mb-3">{{ formatPrice(item.price) }}</p>
                                            <div class="flex items-center justify-between">
                                                <div class="flex items-center gap-3">
                                                    <button @click="decreaseQuantity(item)" class="w-7 h-7 border cursor-pointer hover:bg-[#F5F2EB] transition duration-300 rounded hover:border-[#C6A769]">-</button>
                                                    <span class="font-medium">{{ item.quantity }}</span>
                                                    <button @click="increaseQuantity(item)" class="w-7 h-7 border cursor-pointer hover:bg-[#F5F2EB] transition duration-300 rounded hover:border-[#C6A769]">+</button>
                                                </div>
                                                <div class="relative group">
                                                    <button @click="removeFromCart(item)" class="text-[#1F3B2D] cursor-pointer hover:text-red-500 transition duration-300">
                                                        <Trash2 class="w-5 h-5" />
                                                    </button>
                                                    <div class="absolute right-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition duration-300 bg-[#1F3B2D] text-white text-xs px-3 py-2 rounded-md whitespace-nowrap pointer-events-none">
                                                        Remove from bag
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="cart.length > 0" class="p-4 border-t bg-[#F8F6F1] rounded-b-lg sticky bottom-0">
                                    <div class="flex justify-between items-center mb-4">
                                        <span class="text-sm uppercase tracking-widest text-[#1F3B2D]">Subtotal</span>
                                        <span class="font-semibold text-[#1F3B2D] text-lg">{{ formatPrice(cartTotal) }}</span>
                                    </div>
                                    <button @click="$router.push('/checkout'); showCart = false;" class="w-full bg-[#1F3B2D] text-white py-3 text-sm uppercase tracking-[0.2em] hover:bg-[#2C4D3A] transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-95 rounded-md relative overflow-hidden group">
                                        <span class="relative z-10">Proceed to Checkout</span>
                                        <span class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></span>
                                    </button>
                                </div>
                            </div>
                        </Transition>
                    </div>
                </div>
            </div>
        </nav>

        <div v-if="showAuthModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
            <div class="bg-white w-[480px] relative rounded-lg shadow-2xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
                <button @click="showAuthModal = false; resetAuthForm();"
                    class="absolute top-4 right-4 text-[#1F3B2D] text-2xl font-light cursor-pointer hover:text-[#C6A769] transition duration-300 hover:rotate-90 z-10">
                    ✕
                </button>

                <div class="p-8">
                    <div class="text-center mb-8">
                        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#182E23]/5 mb-4">
                            <img src="/assets/images/Aurex_logo_icon.png" alt="Aurex Logo Icon" class="h-12">
                        </div>
                        <h2 class="font-['Cormorant_Garamond'] text-4xl text-[#1F3B2D]">
                            {{ isLoginMode ? 'Welcome Back' : 'Join AUREX' }}
                        </h2>
                        <p class="text-gray-500 text-sm mt-2">
                            {{ isLoginMode ? 'Sign in to access your account' : 'Create your account to start shopping' }}
                        </p>
                    </div>

                    <div v-if="!showAccountDetails && !isLoginMode">
                        <div class="space-y-4">
                            <div class="group">
                                <label class="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 font-medium transition-colors duration-300 group-focus-within:text-[#C6A769]">
                                    Email Address
                                </label>
                                <input v-model="email" type="email" placeholder="Enter your email"
                                    class="w-full border text-[#1F3B2D] border-gray-300 px-4 py-3 focus:outline-none focus:border-[#C6A769] focus:ring-2 focus:ring-[#C6A769]/20 transition-all duration-300 hover:border-[#C6A769] rounded-lg">
                                <p v-if="emailError" class="text-[#C6A769] text-sm mt-2 animate-pulse">{{ emailError }}</p>
                            </div>
                            <button @click="continueSignup" class="w-full mt-4 bg-[#1F3B2D] text-white py-3.5 uppercase tracking-[0.2em] hover:bg-[#2C4D3A] transition-all duration-300 hover:scale-[1.02] active:scale-95 rounded-lg cursor-pointer relative overflow-hidden group">
                                <span class="relative z-10">Continue</span>
                                <span class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></span>
                            </button>
                        </div>
                    </div>

                    <div v-if="isLoginMode" class="space-y-5">
                        <div class="group">
                            <label class="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 font-medium transition-colors duration-300 group-focus-within:text-[#C6A769]">
                                Email Address
                            </label>
                            <input v-model="loginEmail" type="email" placeholder="Enter your email"
                                class="w-full border text-[#1F3B2D] border-gray-300 px-4 py-3 focus:outline-none focus:border-[#C6A769] focus:ring-2 focus:ring-[#C6A769]/20 transition-all duration-300 hover:border-[#C6A769] rounded-lg">
                        </div>
                        
                        <div class="group">
                            <label class="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 font-medium transition-colors duration-300 group-focus-within:text-[#C6A769]">
                                Password
                            </label>
                            <div class="relative">
                                <input v-model="loginPassword" :type="showPassword ? 'text' : 'password'" placeholder="Enter your password"
                                    class="w-full border text-[#1F3B2D] border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:border-[#C6A769] focus:ring-2 focus:ring-[#C6A769]/20 transition-all duration-300 hover:border-[#C6A769] rounded-lg">
                                <button type="button" @click="showPassword = !showPassword"
                                    class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C6A769] transition duration-300 cursor-pointer">
                                    <Eye v-if="!showPassword" class="w-5 h-5" />
                                    <EyeOff v-else class="w-5 h-5" />
                                </button>
                            </div>
                            <p v-if="loginPasswordError" class="text-[#C6A769] text-sm mt-2">{{ loginPasswordError }}</p>
                        </div>
                        
                        <p v-if="loginError" class="text-[#C6A769] text-sm animate-pulse">{{ loginError }}</p>

                        <div class="text-right mb-4">
                            <a
                                href="#"
                                @click.prevent="showForgotPasswordModal = true"
                                class="text-sm text-[#8B6B3D] hover:underline"
                            >
                                Forgot Password?
                            </a>
                        </div>
                        
                        <button @click="signIn" :disabled="isLoading"
                            class="w-full mt-4 bg-[#1F3B2D] text-white py-3.5 uppercase tracking-[0.2em] hover:bg-[#2C4D3A] transition-all duration-300 hover:scale-[1.02] active:scale-95 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group">
                            <span class="relative z-10">{{ isLoading ? 'Signing In...' : 'Sign In' }}</span>
                            <span class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></span>
                        </button>
                    </div>

                    <div v-if="showAccountDetails && !isLoginMode" class="space-y-4">
                        <button @click="showAccountDetails = false" class="text-[#1F3B2D] text-sm hover:text-[#C6A769] transition duration-300 flex items-center gap-2 cursor-pointer">
                            <span>←</span> Back
                        </button>
                        
                        <div class="bg-[#F5F2EB] rounded-lg p-3 text-center">
                            <p class="text-sm text-[#1F3B2D] font-medium">{{ email }}</p>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-3">
                            <div class="group">
                                <label class="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 font-medium transition-colors duration-300 group-focus-within:text-[#C6A769]">
                                    First Name
                                </label>
                                <input v-model="firstName" type="text" placeholder="John"
                                    class="w-full border text-[#1F3B2D] border-gray-300 px-4 py-3 focus:outline-none focus:border-[#C6A769] focus:ring-2 focus:ring-[#C6A769]/20 transition-all duration-300 hover:border-[#C6A769] rounded-lg">
                            </div>
                            <div class="group">
                                <label class="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 font-medium transition-colors duration-300 group-focus-within:text-[#C6A769]">
                                    Last Name
                                </label>
                                <input v-model="lastName" type="text" placeholder="Doe"
                                    class="w-full border text-[#1F3B2D] border-gray-300 px-4 py-3 focus:outline-none focus:border-[#C6A769] focus:ring-2 focus:ring-[#C6A769]/20 transition-all duration-300 hover:border-[#C6A769] rounded-lg">
                            </div>
                        </div>
                        
                        <div class="group">
                            <label class="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 font-medium transition-colors duration-300 group-focus-within:text-[#C6A769]">
                                Mobile Number
                            </label>
                            <input v-model="mobile" type="tel" placeholder="+96170123456"
                                class="w-full border text-[#1F3B2D] border-gray-300 px-4 py-3 focus:outline-none focus:border-[#C6A769] focus:ring-2 focus:ring-[#C6A769]/20 transition-all duration-300 hover:border-[#C6A769] rounded-lg">
                        </div>
                        
                        <div class="group">
                            <label class="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 font-medium transition-colors duration-300 group-focus-within:text-[#C6A769]">
                                Password
                            </label>
                            <div class="relative">
                                <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Create a password"
                                    class="w-full border text-[#1F3B2D] border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:border-[#C6A769] focus:ring-2 focus:ring-[#C6A769]/20 transition-all duration-300 hover:border-[#C6A769] rounded-lg">
                                <button type="button" @click="showPassword = !showPassword"
                                    class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C6A769] transition duration-300 cursor-pointer">
                                    <Eye v-if="!showPassword" class="w-5 h-5" />
                                    <EyeOff v-else class="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        
                        <div class="group">
                            <label class="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 font-medium transition-colors duration-300 group-focus-within:text-[#C6A769]">
                                Confirm Password
                            </label>
                            <div class="relative">
                                <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" placeholder="Re-enter password"
                                    class="w-full border border-gray-300 px-4 py-3 pr-12 text-[#1F3B2D] focus:outline-none focus:border-[#C6A769] focus:ring-2 focus:ring-[#C6A769]/20 transition-all duration-300 hover:border-[#C6A769] rounded-lg">
                                <button type="button" @click="showConfirmPassword = !showConfirmPassword"
                                    class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C6A769] transition duration-300 cursor-pointer">
                                    <Eye v-if="!showConfirmPassword" class="w-5 h-5" />
                                    <EyeOff v-else class="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        
                        <p v-if="passwordError" class="text-[#C6A769] text-sm animate-pulse">{{ passwordError }}</p>
                        
                        <button @click="createAccount" :disabled="isLoading"
                            class="w-full mt-4 bg-[#1F3B2D] text-white py-3.5 uppercase tracking-[0.2em] hover:bg-[#2C4D3A] transition-all duration-300 hover:scale-[1.02] active:scale-95 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group">
                            <span class="relative z-10">{{ isLoading ? 'Creating Account...' : 'Create Account' }}</span>
                            <span class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></span>
                        </button>
                    </div>

                    <div v-if="!showAccountDetails || isLoginMode">
                        <div class="flex items-center my-6">
                            <div class="flex-1 h-px bg-gray-300"></div>
                            <span class="px-4 text-gray-500 text-sm">or continue with</span>
                            <div class="flex-1 h-px bg-gray-300"></div>
                        </div>
                        
                        <div class="flex justify-center gap-4">
                            <button class="w-12 h-12 border border-gray-300 rounded-full flex items-center justify-center hover:border-[#C6A769] hover:scale-110 transition-all duration-300 cursor-pointer hover:shadow-md">
                                <img src="/assets/icons/google.svg" class="w-6 h-6" alt="Google">
                            </button>
                            <button class="w-12 h-12 border border-gray-300 rounded-full flex items-center justify-center hover:border-[#C6A769] hover:scale-110 transition-all duration-300 cursor-pointer hover:shadow-md">
                                <img src="/assets/icons/facebook.svg" class="w-6 h-6" alt="Facebook">
                            </button>
                        </div>
                        
                        <p class="mt-6 text-center text-gray-500 text-sm">
                            {{ isLoginMode ? 'New to AUREX?' : 'Already have an account?' }}
                            <button @click="toggleAuthMode()" class="text-[#C6A769] ml-1 hover:underline transition duration-300 cursor-pointer font-medium">
                                {{ isLoginMode ? 'Create Account' : 'Sign In' }}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showForgotPasswordModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
            <div class="bg-white w-[480px] relative rounded-lg shadow-2xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
                <button @click="
                    showForgotPasswordModal = false;
                    resetForgotPasswordForm();
                    "
                    class="absolute top-4 right-4 text-[#1F3B2D] text-2xl font-light cursor-pointer hover:text-[#C6A769] transition duration-300 hover:rotate-90 z-10">
                    ✕
                </button>

                <div class="p-8">
                    <div class="text-center mb-8">
                        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#182E23]/5 mb-4">
                            <span class="text-3xl">🔑</span>
                        </div>
                        <h2 class="font-['Cormorant_Garamond'] text-4xl text-[#1F3B2D]">
                            Forgot Password
                        </h2>
                        <p class="text-gray-500 text-sm mt-2">
                            Enter your email address and we'll send you a verification code.
                        </p>
                    </div>

                    <div class="space-y-5">
                        <div class="group">
                            <label class="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 font-medium transition-colors duration-300 group-focus-within:text-[#C6A769]">
                                Email Address
                            </label>
                            <input v-model="forgotPasswordEmail" type="email" placeholder="Enter your email"
                                class="w-full border text-[#1F3B2D] border-gray-300 px-4 py-3 focus:outline-none focus:border-[#C6A769] focus:ring-2 focus:ring-[#C6A769]/20 transition-all duration-300 hover:border-[#C6A769] rounded-lg">
                        </div>

                        <p v-if="forgotPasswordError" class="text-red-500 text-sm animate-pulse">{{ forgotPasswordError }}</p>

                        <button @click="forgotPassword" :disabled="forgotPasswordLoading"
                            class="w-full mt-4 bg-[#1F3B2D] text-white py-3.5 uppercase tracking-[0.2em] hover:bg-[#2C4D3A] transition-all duration-300 hover:scale-[1.02] active:scale-95 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group">
                            <span class="relative z-10">{{ forgotPasswordLoading ? 'Sending...' : 'Send Code' }}</span>
                            <span class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></span>
                        </button>

                        <div class="flex items-center my-6">
                            <div class="flex-1 h-px bg-gray-300"></div>
                            <span class="px-4 text-gray-500 text-xs">Remember your password?</span>
                            <div class="flex-1 h-px bg-gray-300"></div>
                        </div>

                        <div class="text-center">
                            <button @click="
                                showForgotPasswordModal = false;
                                resetForgotPasswordForm();
                                showAuthModal = true;
                                isLoginMode = true;
                                "
                                class="text-[#C6A769] hover:underline transition duration-300 cursor-pointer text-sm font-medium"
                                >
                                Back to Sign In
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showResetPasswordModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
            <div class="bg-white w-[480px] relative rounded-lg shadow-2xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
                <button @click="
                    showResetPasswordModal = false;
                    resetResetPasswordForm();
                    "
                    class="absolute top-4 right-4 text-[#1F3B2D] text-2xl font-light cursor-pointer hover:text-[#C6A769] transition duration-300 hover:rotate-90 z-10">
                    ✕
                </button>

                <div class="p-8">
                    <div class="text-center mb-8">
                        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#182E23]/5 mb-4">
                            <span class="text-3xl">🔐</span>
                        </div>
                        <h2 class="font-['Cormorant_Garamond'] text-4xl text-[#1F3B2D]">
                            Reset Password
                        </h2>
                        <p class="text-gray-500 text-sm mt-2">
                            Enter the verification code sent to your email and choose a new password.
                        </p>
                    </div>

                    <div class="space-y-5">
                        <div class="group">
                            <label class="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 font-medium transition-colors duration-300 group-focus-within:text-[#C6A769]">
                                Verification Code
                            </label>
                            <input v-model="resetCode" type="text" placeholder="Enter verification code"
                                class="w-full border text-[#1F3B2D] border-gray-300 px-4 py-3 focus:outline-none focus:border-[#C6A769] focus:ring-2 focus:ring-[#C6A769]/20 transition-all duration-300 hover:border-[#C6A769] rounded-lg text-center tracking-widest">
                        </div>

                        <div class="group">
                            <label class="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 font-medium transition-colors duration-300 group-focus-within:text-[#C6A769]">
                                New Password
                            </label>
                            <div class="relative">
                                <input v-model="resetNewPassword" :type="showResetPassword ? 'text' : 'password'" placeholder="New password"
                                    class="w-full border text-[#1F3B2D] border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:border-[#C6A769] focus:ring-2 focus:ring-[#C6A769]/20 transition-all duration-300 hover:border-[#C6A769] rounded-lg">
                                <button type="button" @click="showResetPassword = !showResetPassword"
                                    class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C6A769] transition duration-300 cursor-pointer">
                                    <Eye v-if="!showResetPassword" class="w-5 h-5" />
                                    <EyeOff v-else class="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div class="group">
                            <label class="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 font-medium transition-colors duration-300 group-focus-within:text-[#C6A769]">
                                Confirm Password
                            </label>
                            <div class="relative">
                                <input v-model="resetConfirmPassword" :type="showResetConfirmPassword ? 'text' : 'password'" placeholder="Confirm password"
                                    class="w-full border text-[#1F3B2D] border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:border-[#C6A769] focus:ring-2 focus:ring-[#C6A769]/20 transition-all duration-300 hover:border-[#C6A769] rounded-lg">
                                <button type="button" @click="showResetConfirmPassword = !showResetConfirmPassword"
                                    class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C6A769] transition duration-300 cursor-pointer">
                                    <Eye v-if="!showResetConfirmPassword" class="w-5 h-5" />
                                    <EyeOff v-else class="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <p v-if="resetPasswordError" class="text-red-500 text-sm animate-pulse">{{ resetPasswordError }}</p>

                        <button @click="resetPassword" :disabled="resetPasswordLoading"
                            class="w-full mt-4 bg-[#1F3B2D] text-white py-3.5 uppercase tracking-[0.2em] hover:bg-[#2C4D3A] transition-all duration-300 hover:scale-[1.02] active:scale-95 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group">
                            <span class="relative z-10">{{ resetPasswordLoading ? 'Resetting...' : 'Reset Password' }}</span>
                            <span class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></span>
                        </button>

                        <div class="flex items-center my-6">
                            <div class="flex-1 h-px bg-gray-300"></div>
                            <span class="px-4 text-gray-500 text-xs">Remember your password?</span>
                            <div class="flex-1 h-px bg-gray-300"></div>
                        </div>

                        <div class="text-center">
                            <button @click="
                                showResetPasswordModal = false;
                                resetResetPasswordForm();
                                showAuthModal = true;
                                isLoginMode = true;
                                " class="text-[#C6A769] hover:underline transition duration-300 cursor-pointer text-sm font-medium"
                                >
                                Back to Sign In
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showOTPModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
            <div class="bg-white w-[480px] relative rounded-lg shadow-2xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
                <button @click="closeOTPModal()"
                    class="absolute top-4 right-4 text-[#1F3B2D] text-2xl font-light cursor-pointer hover:text-[#C6A769] transition duration-300 hover:rotate-90 z-10">
                    ✕
                </button>

                <div class="p-8">
                    <div class="text-center mb-8">
                        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#182E23]/5 mb-4">
                            <span class="text-3xl">📧</span>
                        </div>
                        <h2 class="font-['Cormorant_Garamond'] text-4xl text-[#1F3B2D]">
                            Verify Your Email
                        </h2>
                        <p class="text-gray-500 text-sm mt-2">
                            We've sent a verification code to your email address.
                        </p>
                        <p class="text-[#C6A769] text-xs mt-1 font-medium">
                            {{ otpEmail || email }}
                        </p>
                    </div>

                    <div class="space-y-5">
                        <div class="group">
                            <label class="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 font-medium transition-colors duration-300 group-focus-within:text-[#C6A769]">
                                Verification Code
                            </label>
                            <input v-model="otpCode" type="text" placeholder="Enter 4-digit code"
                                class="w-full border text-[#1F3B2D] border-gray-300 px-4 py-3 focus:outline-none focus:border-[#C6A769] focus:ring-2 focus:ring-[#C6A769]/20 transition-all duration-300 hover:border-[#C6A769] rounded-lg text-center text-2xl tracking-widest"
                                maxlength="6"
                                @keyup.enter="verifyOTP"
                                autofocus
                            >
                            <p v-if="otpError" class="text-red-500 text-sm mt-2 animate-pulse">{{ otpError }}</p>
                        </div>

                        <button @click="verifyOTP" :disabled="otpLoading || !otpCode"
                            class="w-full mt-4 bg-[#1F3B2D] text-white py-3.5 uppercase tracking-[0.2em] hover:bg-[#2C4D3A] transition-all duration-300 hover:scale-[1.02] active:scale-95 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group">
                            <span class="relative z-10">{{ otpLoading ? 'Verifying...' : 'Verify Code' }}</span>
                            <span class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></span>
                        </button>

                        <div class="text-center">
                            <p class="text-gray-500 text-sm">
                                Didn't receive the code?
                                <button @click="sendOTP" :disabled="otpResendLoading"
                                    class="text-[#C6A769] hover:underline transition duration-300 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                                    {{ otpResendLoading ? 'Sending...' : 'Resend Code' }}
                                </button>
                            </p>
                            <p v-if="otpResendSuccess" class="text-green-600 text-sm mt-2 animate-pulse">
                                ✓ New code sent successfully!
                            </p>
                        </div>
                    </div>

                    <div class="flex items-center my-6">
                        <div class="flex-1 h-px bg-gray-300"></div>
                        <span class="px-4 text-gray-500 text-xs">Need help?</span>
                        <div class="flex-1 h-px bg-gray-300"></div>
                    </div>

                    <div class="text-center">
                        <p class="text-gray-500 text-sm">
                            Check your spam folder if you don't see the email.
                        </p>
                        <button @click="closeOTPModal" class="text-[#C6A769] text-sm hover:underline transition duration-300 cursor-pointer mt-2">
                            Back to Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </header>
</template>

<style scoped>
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

::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

::-webkit-scrollbar-thumb {
    background: #C6A769;
    border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
    background: #b8964a;
}
</style>



