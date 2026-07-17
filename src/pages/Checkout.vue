<script setup>
import { Eye, EyeOff } from 'lucide-vue-next'
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { cart, fetchCart, clearCart } from '../stores/cart'
import { formatPrice } from '../stores/currency'
import { authService } from '../api/authService'
import { checkoutService } from '../api/checkoutService'
import { shippingService } from '../api/shippingService'

const router = useRouter()
let observer = null

const paymentMethods = ref([])
const paymentMethodMap = ref({})

const countryList = [
    { code: 'LB', name: 'Lebanon', dialCode: '+961' },
    { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
    { code: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
    { code: 'KW', name: 'Kuwait', dialCode: '+965' },
    { code: 'QA', name: 'Qatar', dialCode: '+974' },
    { code: 'BH', name: 'Bahrain', dialCode: '+973' },
    { code: 'OM', name: 'Oman', dialCode: '+968' },
    { code: 'JO', name: 'Jordan', dialCode: '+962' },
    { code: 'EG', name: 'Egypt', dialCode: '+20' },
    { code: 'IQ', name: 'Iraq', dialCode: '+964' },
    { code: 'SY', name: 'Syria', dialCode: '+963' },
    { code: 'YE', name: 'Yemen', dialCode: '+967' }
]

const shippingRates = {
    LB: 0,
    AE: 10,
    SA: 10,
    KW: 10,
    QA: 10,
    BH: 10,
    OM: 10,
    JO: 10,
    EG: 10,
    IQ: 10,
    SY: 10,
    YE: 10
}

const showDropdown = ref(false)
const searchTerm = ref('')

const showPhoneDropdown = ref(false)
const phoneSearchTerm = ref('')
const selectedPhoneCountry = ref(null)
const phoneNumber = ref('')

const showPaymentPopup = ref(false)
const isProcessing = ref(false)

const paymentErrors = ref({})
const errors = ref({})
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const phone = ref('')
const country = ref('')
const countryId = ref('')
const address = ref('')
const zoneId = ref('')
const postalCode = ref('')
const paymentMethod = ref('Cash On Delivery')
const paymentMethodId = ref('')

const cardName = ref('')
const cardNumber = ref('')
const expiryDate = ref('')
const cvv = ref('')

const paypalEmail = ref('')
const paypalPassword = ref('')
const showPaypalPassword = ref(false)

const orderResponse = ref(null)

const shippingCountries = ref([])
const countryMap = ref({})

const subtotal = computed(() => {
    return cart.value.reduce((total, item) => {
        return total + (item.price * item.quantity)
    }, 0)
})

const total = computed(() => {
    if (shippingCost.value === null) return null
    return subtotal.value + shippingCost.value
})

const shippingCost = computed(() => {
    if (!country.value) return null
    return shippingRates[country.value] ?? 10 
})

const filteredCountries = computed(() => {
    if (!searchTerm.value) return countryList
    return countryList.filter(c => 
        c.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        c.dialCode.includes(searchTerm.value)
    )
})

const filteredPhoneCountries = computed(() => {
    if (!phoneSearchTerm.value) return countryList
    return countryList.filter(c => 
        c.name.toLowerCase().includes(phoneSearchTerm.value.toLowerCase()) ||
        c.code.toLowerCase().includes(phoneSearchTerm.value.toLowerCase()) ||
        c.dialCode.includes(phoneSearchTerm.value)
    )
})

const getCountryName = (code) => {
    const country = countryList.find(c => c.code === code)
    return country ? country.name : ''
}

const getDialCode = (code) => {
    const country = countryList.find(c => c.code === code)
    return country ? country.dialCode : ''
}

const selectCountry = (code) => {
    country.value = code

    const selected = countryList.find(c => c.code === code)

    if (selected) {
        const shippingCountry = shippingCountries.value.find(
            c => c.country_name === selected.name
        )

        if (shippingCountry) {
            countryId.value = shippingCountry.id
            zoneId.value = shippingCountry.shipping_zones?.[0]?.id || ''
        }
    }

    showDropdown.value = false
    searchTerm.value = ''
}

const closeDropdown = (e) => {
    if (!e.target.closest('.country-select-wrapper')) {
        showDropdown.value = false
    }
    if (!e.target.closest('.phone-country-wrapper')) {
        showPhoneDropdown.value = false
    }
}

function validateOrder() {
    errors.value = {}

    if (!firstName.value.trim())
        errors.value.firstName = 'First name is required'

    if (!lastName.value.trim())
        errors.value.lastName = 'Last name is required'

    if (!email.value.trim())
        errors.value.email = 'Email is required'

    if (
        email.value &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
    )
        errors.value.email = 'Invalid email address'

    const phoneNumberOnly = phone.value.replace(/^\+\d+\s*/, '').replace(/[\s\-()]/g, '')
    
    if (!phone.value || !phoneNumberOnly) {
        errors.value.phone = 'Phone number is required'
    } else if (selectedPhoneCountry.value) {
        const countryCode = selectedPhoneCountry.value.code
        const format = phoneFormats[countryCode]
        
        if (format) {
            if (phoneNumberOnly.length < format.minLength || phoneNumberOnly.length > format.maxLength) {
                errors.value.phone = `Phone number must be ${format.minLength}-${format.maxLength} digits for ${selectedPhoneCountry.value.name}`
            } else if (!format.pattern.test(phoneNumberOnly)) {
                errors.value.phone = `Invalid phone number format for ${selectedPhoneCountry.value.name}`
            }
        } else {
            if (phoneNumberOnly.length < 6 || phoneNumberOnly.length > 15) {
                errors.value.phone = 'Valid phone number is required (6-15 digits)'
            }
        }
    } else {
        if (phoneNumberOnly.length < 6 || phoneNumberOnly.length > 15) {
            errors.value.phone = 'Valid phone number is required (6-15 digits)'
        }
    }

    if (!country.value.trim())
        errors.value.country = 'Country is required'

    if (!address.value.trim())
        errors.value.address = 'Address is required'

    const postalCodeTrimmed = postalCode.value.trim()
    if (!postalCodeTrimmed) {
        errors.value.postalCode = 'Postal code is required'
    } else if (!/^[0-9a-zA-Z\s\-]{3,10}$/.test(postalCodeTrimmed)) {
        errors.value.postalCode = 'Invalid postal code format'
    }

    return Object.keys(errors.value).length === 0
}

function validatePayment() {
    paymentErrors.value = {}

    if (paymentMethod.value === 'Credit Card') {
        if (!cardName.value.trim())
            paymentErrors.value.cardName = 'Cardholder name is required'

        const cleanCardNumber = cardNumber.value.replace(/\s/g, '')
        
        if (!cleanCardNumber)
            paymentErrors.value.cardNumber = 'Card number is required'
        else if (!/^\d{13,19}$/.test(cleanCardNumber))
            paymentErrors.value.cardNumber = 'Card number must contain 13-19 digits'
        else {
            let sum = 0
            let isEven = false
            for (let i = cleanCardNumber.length - 1; i >= 0; i--) {
                let digit = parseInt(cleanCardNumber.charAt(i), 10)
                if (isEven) {
                    digit *= 2
                    if (digit > 9) digit -= 9
                }
                sum += digit
                isEven = !isEven
            }
            if (sum % 10 !== 0)
                paymentErrors.value.cardNumber = 'Invalid card number'
        }

        const cleanExpiry = expiryDate.value.replace(/\s/g, '')
        if (!cleanExpiry)
            paymentErrors.value.expiryDate = 'Expiry date is required'
        else if (!/^\d{2}\/\d{2}$/.test(cleanExpiry))
            paymentErrors.value.expiryDate = 'Use MM/YY format'
        else {
            const [month, year] = cleanExpiry.split('/').map(Number)
            const currentYear = new Date().getFullYear() % 100
            const currentMonth = new Date().getMonth() + 1
            
            if (month < 1 || month > 12)
                paymentErrors.value.expiryDate = 'Invalid month (01-12)'
            else if (year < currentYear || (year === currentYear && month < currentMonth))
                paymentErrors.value.expiryDate = 'Card has expired'
        }

        const cleanCVV = cvv.value.replace(/\s/g, '')
        if (!cleanCVV)
            paymentErrors.value.cvv = 'CVV is required'
        else if (!/^\d{3,4}$/.test(cleanCVV))
            paymentErrors.value.cvv = 'CVV must be 3 or 4 digits'
    }

    if (paymentMethod.value === 'PayPal') {
        if (!paypalEmail.value.trim())
            paymentErrors.value.paypalEmail = 'PayPal email is required'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail.value))
            paymentErrors.value.paypalEmail = 'Invalid PayPal email'
        else if (paypalEmail.value.length > 254)
            paymentErrors.value.paypalEmail = 'Email is too long'

        if (!paypalPassword.value.trim())
            paymentErrors.value.paypalPassword = 'PayPal password is required'
        else if (paypalPassword.value.length < 6)
            paymentErrors.value.paypalPassword = 'Password must be at least 6 characters'
        else if (paypalPassword.value.length > 50)
            paymentErrors.value.paypalPassword = 'Password is too long'
    }

    return Object.keys(paymentErrors.value).length === 0
}

async function placeOrder() {
    if (!validateOrder()) return

    if (paymentMethod.value === 'Credit Card' || paymentMethod.value === 'PayPal') {
        showPaymentPopup.value = true
        return
    }

    if (paymentMethod.value === 'Cash On Delivery') {
        await confirmPayment()
    }
}

async function confirmPayment() {
    if (!validatePayment()) return

    isProcessing.value = true

    try {

        const orderData = {
            items: cart.value.map(item => ({
                id: item.id,
                variant_id: item.variant_id || item.id,
                quantity: item.quantity,
                price: item.price
            })),
            shipping: {
                firstName: firstName.value,
                lastName: lastName.value,
                email: email.value,
                phone: phone.value,
                address: address.value,
                postalCode: postalCode.value,
                countryId: countryId.value,
                zoneId: zoneId.value
            },
            payment: {
                method_id: paymentMethodId.value
            },
            total: total.value,
            currency: 'USD'
        }

        const response = await checkoutService.createOrder(orderData)
        orderResponse.value = response

        const purchasedItems = [...cart.value]
        const orderTotal = total.value !== null ? formatPrice(total.value) : 'Pending'

        await clearCart()

        const orders = JSON.parse(localStorage.getItem('orders')) || []

        const order = {
            id: response.order_id || `AURX-${Date.now()}`,
            items: purchasedItems,
            total: orderTotal,
            status: response.status || 'Processing',
            date: new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            })
        }
        orders.unshift(order)
        localStorage.setItem('orders', JSON.stringify(orders))

        showPaymentPopup.value = false
        router.push('/OrderHistory')

    } catch (error) {
        console.error('Order failed:', error)
        const errorMessage = error.message || 'Failed to place order. Please try again.'
        alert(errorMessage)
    } finally {
        isProcessing.value = false
    }
}

async function fetchPaymentMethods() {
  try {
    const paymentData = await checkoutService.getPaymentMethods()
    const availableData = await checkoutService.getAvailablePaymentMethods()

    if (paymentData?.results) {
      paymentMethods.value = paymentData.results

      paymentData.results.forEach(method => {
        const name = method.name || method.method_name || ''
        paymentMethodMap.value[name.toLowerCase()] = method.id
      })

      // Find Cash on Delivery from payment-methods
      const codMethod = paymentData.results.find(m =>
        (m.name || '').toLowerCase().includes('cash')
      )

      if (codMethod && availableData?.results) {

        // Find the AVAILABLE payment method that points to COD
        const availableMethod = availableData.results.find(
          m => m.method === codMethod.id
        )

        if (availableMethod) {
          paymentMethodId.value = availableMethod.id
        }
      }
    }

  } catch (error) {
    console.error('Failed to fetch payment methods:', error)
  }
}

async function fetchShippingCountries() {
  try {
    const data = await shippingService.getShippingCountries()

    shippingCountries.value = data.results || data

    shippingCountries.value.forEach(country => {
        countryMap.value[country.country_name] = country.id
    })
  } catch (error) {
    console.error(error)
  }
}

function getPaymentDetails() {
    if (paymentMethod.value === 'Credit Card') {
        return {
            cardholder_name: cardName.value,
            card_number: cardNumber.value.replace(/\s/g, ''),
            expiry_date: expiryDate.value,
            cvv: cvv.value
        }
    }
    if (paymentMethod.value === 'PayPal') {
        return {
            email: paypalEmail.value,
            password: paypalPassword.value
        }
    }
    return {}
}

function formatPhoneNumber() {
    if (!selectedPhoneCountry.value || !phone.value) return
    
    const countryCode = selectedPhoneCountry.value.code
    const format = phoneFormats[countryCode]
    if (!format) return

    let digits = phone.value.replace(/^\+\d+\s*/, '').replace(/\D/g, '')

    let formatted = ''
    
    if (countryCode === 'LB') {
        if (digits.length <= 2) {
            formatted += digits
        } else if (digits.length <= 4) {
            formatted += digits.substring(0, 2) + ' ' + digits.substring(2)
        } else {
            formatted += digits.substring(0, 2) + ' ' + digits.substring(2, 5) + ' ' + digits.substring(5, 8)
        }
    } else if (countryCode === 'AE' || countryCode === 'SA') {
        if (digits.length <= 2) {
            formatted += digits
        } else if (digits.length <= 5) {
            formatted += digits.substring(0, 2) + ' ' + digits.substring(2)
        } else {
            formatted += digits.substring(0, 2) + ' ' + digits.substring(2, 5) + ' ' + digits.substring(5, 9)
        }
    } else if (countryCode === 'KW' || countryCode === 'QA' || countryCode === 'BH' || countryCode === 'OM') {
        if (digits.length <= 2) {
            formatted += digits
        } else if (digits.length <= 5) {
            formatted += digits.substring(0, 2) + ' ' + digits.substring(2)
        } else {
            formatted += digits.substring(0, 2) + ' ' + digits.substring(2, 5) + ' ' + digits.substring(5, 8)
        }
    } else {
        const parts = []
        for (let i = 0; i < digits.length; i += 3) {
            parts.push(digits.substring(i, i + 3))
        }
        formatted += parts.join(' ')
    }
    
    phone.value = formatted.trim()
}

const selectPhoneCountry = (code) => {
    const country = countryList.find(c => c.code === code)
    selectedPhoneCountry.value = country
    showPhoneDropdown.value = false
    phoneSearchTerm.value = ''

    if (phone.value) {
        const digits = phone.value.replace(/^\+\d+\s*/, '').replace(/\D/g, '')
        phone.value = country.dialCode + ' ' + digits
        formatPhoneNumber()
    }
}

watch(phone, (newValue, oldValue) => {
    if (selectedPhoneCountry.value && newValue && !newValue.includes(' ')) {
        const digits = newValue.replace(/\D/g, '')
        if (digits.length > 0) {
            const dialCode = selectedPhoneCountry.value.dialCode
            phone.value = dialCode + ' ' + digits
            formatPhoneNumber()
        }
    }
}, { immediate: false })

const phoneFormats = {
    LB: {
        format: '+961 ## ### ###',
        minLength: 7,
        maxLength: 8,
        pattern: /^[0-9]{7,8}$/
    },
    AE: {
        format: '+971 ## ### ####',
        minLength: 9,
        maxLength: 9,
        pattern: /^[0-9]{9}$/
    },
    SA: {
        format: '+966 ## ### ####',
        minLength: 9,
        maxLength: 9,
        pattern: /^[0-9]{9}$/
    },
    KW: {
        format: '+965 ## ### ###',
        minLength: 8,
        maxLength: 8,
        pattern: /^[0-9]{8}$/
    },
    QA: {
        format: '+974 ## ### ###',
        minLength: 8,
        maxLength: 8,
        pattern: /^[0-9]{8}$/
    },
    BH: {
        format: '+973 ## ### ###',
        minLength: 8,
        maxLength: 8,
        pattern: /^[0-9]{8}$/
    },
    OM: {
        format: '+968 ## ### ###',
        minLength: 8,
        maxLength: 8,
        pattern: /^[0-9]{8}$/
    },
    JO: {
        format: '+962 ## ### ####',
        minLength: 9,
        maxLength: 9,
        pattern: /^[0-9]{9}$/
    },
    EG: {
        format: '+20 ## ### ####',
        minLength: 9,
        maxLength: 10,
        pattern: /^[0-9]{9,10}$/
    },
    IQ: {
        format: '+964 ## ### ####',
        minLength: 9,
        maxLength: 10,
        pattern: /^[0-9]{9,10}$/
    },
    SY: {
        format: '+963 ## ### ###',
        minLength: 8,
        maxLength: 9,
        pattern: /^[0-9]{8,9}$/
    },
    YE: {
        format: '+967 ## ### ###',
        minLength: 8,
        maxLength: 9,
        pattern: /^[0-9]{8,9}$/
    }
}

function formatCardNumber() {
    const cleaned = cardNumber.value.replace(/\D/g, '')
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim()
    cardNumber.value = formatted
}

function formatExpiryDate() {
    const cleaned = expiryDate.value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
        const month = cleaned.substring(0, 2)
        const year = cleaned.substring(2, 4)
        expiryDate.value = month + (year ? '/' + year : '')
    } else {
        expiryDate.value = cleaned
    }
}

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

async function loadUserInfo() {
    if (!authService.isAuthenticated()) return

    try {
        const user = await authService.getCurrentUser()

        firstName.value = user.first_name || ''
        lastName.value = user.last_name || ''
        email.value = user.email || ''

        if (user.mobile || user.mobile_number) {
            const mobileNumber = user.mobile || user.mobile_number
            phone.value = mobileNumber

            const matchedCountry = countryList.find(c =>
                mobileNumber.startsWith(c.dialCode)
            )

            if (matchedCountry) {
                selectedPhoneCountry.value = matchedCountry
            }
        }

        if (user.default_address) {
            address.value = user.default_address.address || ''
            postalCode.value = user.default_address.postal_code || ''
            country.value = user.default_address.country || ''
        }

    } catch (error) {
        console.error('Failed to load user information:', error)
    }
}

onMounted(async () => {
    setupObserver()
    document.addEventListener('click', closeDropdown)

    await fetchCart()

    const defaultCountry = countryList.find(c => c.code === 'LB')
    if (defaultCountry) {
        selectedPhoneCountry.value = defaultCountry
    }

    await loadUserInfo()
    await fetchPaymentMethods()
    await fetchShippingCountries()
})

onUnmounted(() => {
    if (observer) observer.disconnect()
    document.removeEventListener('click', closeDropdown)
})
</script>

<template>
    <section class="bg-[#F5F2EB] min-h-screen overflow-hidden">
        <div class="max-w-7xl mx-auto px-8 py-24 fade-in"
             style="opacity: 0; transform: translateY(40px); transition: all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
            <p class="uppercase tracking-[0.3em] text-[#C6A769] text-sm">
                Checkout
            </p>

            <h1 class="font-['Cormorant_Garamond'] text-6xl text-[#1F3B2D] mt-4">
                Complete Your Order
            </h1>

            <div class="grid lg:grid-cols-[1fr_400px] gap-10 mt-16">
                <div class="bg-white border border-gray-200 shadow-sm p-10 fade-in"
                     style="opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s;">
                    <h2 class="font-['Cormorant_Garamond'] text-4xl text-[#1F3B2D]">
                        Shipping Information
                    </h2>

                    <div class="grid md:grid-cols-2 gap-6 mt-8">
                        <div class="w-full group">
                            <input
                                v-model="firstName"
                                placeholder="First Name"
                                class="border border-gray-300 p-3 w-full transition-all duration-300 focus:border-[#C6A769] focus:shadow-md hover:border-[#C6A769] outline-none"
                            />
                            <p v-if="errors.firstName" class="text-red-500 text-sm mt-1 animate-pulse">
                                {{ errors.firstName }}
                            </p>
                        </div>

                        <div class="w-full group">
                            <input
                                v-model="lastName"
                                placeholder="Last Name"
                                class="border border-gray-300 p-3 w-full transition-all duration-300 focus:border-[#C6A769] focus:shadow-md hover:border-[#C6A769] outline-none"
                            />
                            <p v-if="errors.lastName" class="text-red-500 text-sm mt-1 animate-pulse">
                                {{ errors.lastName }}
                            </p>
                        </div>

                        <div class="w-full group">
                            <input
                                v-model="email"
                                placeholder="Email"
                                class="border border-gray-300 p-3 w-full transition-all duration-300 focus:border-[#C6A769] focus:shadow-md hover:border-[#C6A769] outline-none"
                            />
                            <p v-if="errors.email" class="text-red-500 text-sm mt-1 animate-pulse">
                                {{ errors.email }}
                            </p>
                        </div>

                        <div class="w-full group phone-country-wrapper relative">
                            <div class="flex border border-gray-300 transition-all duration-300 focus-within:border-[#C6A769] focus-within:shadow-md hover:border-[#C6A769]">
                                <div 
                                    @click="showPhoneDropdown = !showPhoneDropdown"
                                    class="flex items-center gap-2 px-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200 border-r border-gray-300 min-w-[120px]"
                                    :class="{ 'bg-gray-50': showPhoneDropdown }"
                                >
                                    <span v-if="selectedPhoneCountry" class="font-medium">
                                        {{ selectedPhoneCountry.dialCode }}
                                    </span>
                                    <span v-else class="text-gray-400">+XXX</span>
                                    <i class="fa-solid fa-chevron-down text-xs transition-transform duration-300" 
                                    :class="{ 'rotate-180': showPhoneDropdown }"></i>
                                </div>

                                <input
                                    v-model="phone"
                                    @input="formatPhoneNumber"
                                    type="tel"
                                    placeholder="Phone Number"
                                    class="p-3 flex-1 outline-none min-w-0"
                                />
                            </div>

                            <div v-if="showPhoneDropdown" 
                                class="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-60 overflow-hidden flex flex-col"
                                style="top: 100%;">

                                <div class="p-2 border-b border-gray-200">
                                    <input
                                        v-model="phoneSearchTerm"
                                        placeholder="Search country..."
                                        class="w-full p-2 border border-gray-300 outline-none focus:border-[#C6A769] transition-all duration-300"
                                        @click.stop
                                    />
                                </div>

                                <div class="overflow-y-auto flex-1">
                                    <div 
                                        v-for="countryItem in filteredPhoneCountries" 
                                        :key="countryItem.code"
                                        @click="selectPhoneCountry(countryItem.code)"
                                        class="p-3 hover:bg-[#F5F2EB] cursor-pointer transition-colors duration-200 flex justify-between items-center"
                                        :class="{ 'bg-[#F5F2EB]': selectedPhoneCountry && selectedPhoneCountry.code === countryItem.code }"
                                    >
                                        <span>{{ countryItem.name }}</span>
                                        <span class="text-sm font-medium text-[#C6A769]">{{ countryItem.dialCode }}</span>
                                    </div>
                                    
                                    <div v-if="filteredPhoneCountries.length === 0" class="p-4 text-center text-gray-500">
                                        No countries found
                                    </div>
                                </div>
                            </div>
                            
                            <p v-if="errors.phone" class="text-red-500 text-sm mt-1 animate-pulse">
                                {{ errors.phone }}
                            </p>
                        </div>

                        <div class="w-full group country-select-wrapper relative">
                            <div 
                                @click="showDropdown = !showDropdown"
                                class="border border-gray-300 p-3 w-full transition-all duration-300 focus-within:border-[#C6A769] hover:border-[#C6A769] cursor-pointer flex justify-between items-center"
                                :class="{ 'border-[#C6A769] shadow-md': showDropdown }"
                            >
                                <span :class="{ 'text-gray-500': !country }">
                                    {{ country ? getCountryName(country) : 'Select Country' }}
                                </span>
                                <i class="fa-solid fa-chevron-down transition-transform duration-300" 
                                   :class="{ 'rotate-180': showDropdown }"></i>
                            </div>

                            <div v-if="showDropdown" 
                                 class="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-60 overflow-hidden flex flex-col"
                                 style="top: 100%;">

                                <div class="p-2 border-b border-gray-200">
                                    <input
                                        v-model="searchTerm"
                                        placeholder="Search country..."
                                        class="w-full p-2 border border-gray-300 outline-none focus:border-[#C6A769] transition-all duration-300"
                                        @click.stop
                                    />
                                </div>
                                
                                <div class="overflow-y-auto flex-1">
                                    <div 
                                        v-for="countryItem in filteredCountries" 
                                        :key="countryItem.code"
                                        @click="selectCountry(countryItem.code)"
                                        class="p-3 hover:bg-[#F5F2EB] cursor-pointer transition-colors duration-200 flex justify-between items-center"
                                        :class="{ 'bg-[#F5F2EB]': country === countryItem.code }"
                                    >
                                        <span>{{ countryItem.name }}</span>
                                        <span class="text-xs text-gray-400">{{ countryItem.code }}</span>
                                    </div>
                                    
                                    <div v-if="filteredCountries.length === 0" class="p-4 text-center text-gray-500">
                                        No countries found
                                    </div>
                                </div>
                            </div>
                            
                            <p v-if="errors.country" class="text-red-500 text-sm mt-1 animate-pulse">
                                {{ errors.country }}
                            </p>
                        </div>

                        <div class="w-full group">
                            <input
                                v-model="address"
                                placeholder="Address"
                                class="border border-gray-300 p-3 w-full transition-all duration-300 focus:border-[#C6A769] focus:shadow-md hover:border-[#C6A769] outline-none"
                            />
                            <p v-if="errors.address" class="text-red-500 text-sm mt-1 animate-pulse">
                                {{ errors.address }}
                            </p>
                        </div>

                        <div class="w-full group">
                            <input
                                v-model="postalCode"
                                placeholder="Post Code/Zip Code"
                                class="border border-gray-300 p-3 w-full transition-all duration-300 focus:border-[#C6A769] focus:shadow-md hover:border-[#C6A769] outline-none"
                            />
                            <p v-if="errors.postalCode" class="text-red-500 text-sm mt-1 animate-pulse">
                                {{ errors.postalCode }}
                            </p>
                        </div>
                    </div>

                    <h2 class="font-['Cormorant_Garamond'] text-4xl text-[#1F3B2D] mt-12">
                        Payment Method
                    </h2>

                    <div class="space-y-4 mt-6">
                        <label class="border border-gray-200 p-4 flex items-center gap-4 cursor-pointer transition-all duration-300 hover:border-[#C6A769] hover:shadow-md hover:-translate-y-0.5 relative group">
                            <input type="radio" value="Credit Card" v-model="paymentMethod" class="accent-[#C6A769] w-4 h-4" disabled>
                            <i class="fa-regular fa-credit-card text-[#C6A769] text-xl"></i>
                            Credit Card
                            <span class="absolute -top-2 -right-2 bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                Unavailable
                            </span>
                            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-[#1F3B2D] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                                Payment method not available
                                <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1F3B2D]"></div>
                            </div>
                        </label>
                       
                        <label class="border border-gray-200 p-4 flex items-center gap-4 cursor-pointer transition-all duration-300 hover:border-[#C6A769] hover:shadow-md hover:-translate-y-0.5 relative group">
                            <input type="radio" value="PayPal" v-model="paymentMethod" class="accent-[#C6A769] w-4 h-4" disabled>
                            <i class="fa-brands fa-paypal text-[#0070BA] text-xl"></i>
                            PayPal
                            <span class="absolute -top-2 -right-2 bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                Unavailable
                            </span>
                            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-[#1F3B2D] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                                Payment method not available
                                <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1F3B2D]"></div>
                            </div>
                        </label>

                        <label class="border border-gray-200 p-4 flex items-center gap-4 cursor-pointer transition-all duration-300 hover:border-[#C6A769] hover:shadow-md hover:-translate-y-0.5">
                            <input type="radio" value="Cash On Delivery" v-model="paymentMethod" class="accent-[#C6A769] w-4 h-4">
                            <i class="fa-solid fa-money-bill text-green-600 text-xl"></i>
                            Cash On Delivery
                        </label>
                    </div>
                </div>

                <div class="bg-white border border-gray-200 shadow-sm p-10 h-fit fade-in"
                     style="opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s;">
                    <h2 class="font-['Cormorant_Garamond'] text-4xl text-[#1F3B2D]">
                        Order Summary
                    </h2>

                    <div v-if="cart.length" class="space-y-6 mt-8">
                        <div v-for="item in cart" :key="item.id" class="flex justify-between transition-all duration-300 hover:pl-2">
                            <div>
                                <p class="font-medium">{{ item.name }}</p>
                                <p class="text-sm text-gray-500">
                                    Qty: {{ item.quantity }}
                                    <span v-if="item.selectedSize">• Size: {{ item.selectedSize }}</span>
                                </p>
                            </div>
                            <p>{{ formatPrice(item.price) }}</p>
                        </div>

                        <div class="border-t pt-6 mt-6">
                            <div class="flex justify-between">
                                <span>Subtotal</span>
                                <span>{{ formatPrice(subtotal) }}</span>
                            </div>

                           <div class="flex justify-between mt-3">
                                <span>Shipping</span>

                                <span v-if="shippingCost !== null">
                                    {{ shippingCost === 0 ? 'Free' : formatPrice(shippingCost) }}
                                </span>

                                <span v-else class="text-gray-400 italic">
                                    Select a country
                                </span>
                            </div>

                            <div class="flex justify-between mt-4 text-xl font-semibold text-[#1F3B2D]">
                                <span>Total</span>

                                <span v-if="total !== null">
                                    {{ formatPrice(total) }}
                                </span>

                                <span v-else class="text-gray-400">
                                    —
                                </span>
                            </div>
                        </div>

                        <button @click="placeOrder" :disabled="isProcessing" class="w-full mt-8 bg-[#1F3B2D] text-white py-4 uppercase tracking-[0.2em] cursor-pointer transition-all duration-300 hover:bg-[#2A4F3C] hover:scale-[1.02] hover:shadow-2xl active:scale-95 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed">
                            <span class="relative z-10">{{ isProcessing ? 'Processing...' : 'Place Order' }}</span>
                            <span class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></span>
                        </button>
                    </div>

                    <div v-else class="text-center py-10">
                        <p class="text-gray-500">Your cart is empty.</p>
                        <router-link to="/shop" class="inline-block mt-4 text-[#C6A769] hover:underline transition duration-300">
                            Continue Shopping
                        </router-link>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showPaymentPopup" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
            <div class="bg-white p-10 w-full max-w-lg shadow-xl transform transition-all duration-300 scale-100">
                <div v-if="paymentMethod === 'Credit Card'">
                    <h2 class="font-['Cormorant_Garamond'] text-4xl text-[#1F3B2D] mb-6">
                        Credit Card Details
                    </h2>

                    <div class="group">
                        <input
                            v-model="cardName"
                            placeholder="Cardholder Name"
                            class="border border-gray-300 p-3 w-full mt-1 mb-3 transition-all duration-300 focus:border-[#C6A769] focus:shadow-md hover:border-[#C6A769] outline-none"
                        >
                        <p v-if="paymentErrors.cardName" class="text-red-500 text-sm mt-1 mb-3 animate-pulse">
                            {{ paymentErrors.cardName || '' }}
                        </p>
                    </div>

                    <div class="group">
                        <input
                            v-model="cardNumber"
                            @input="formatCardNumber"
                            placeholder="Card Number"
                            class="border border-gray-300 p-3 w-full mt-1 mb-3 transition-all duration-300 focus:border-[#C6A769] focus:shadow-md hover:border-[#C6A769] outline-none"
                            maxlength="23"
                        />
                        <p v-if="paymentErrors.cardNumber" class="text-red-500 text-sm mt-1 mb-3 animate-pulse">
                            {{ paymentErrors.cardNumber || '' }}
                        </p>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="group">
                            <input
                                v-model="expiryDate"
                                @input="formatExpiryDate"
                                placeholder="MM/YY"
                                class="border border-gray-300 p-3 w-full mt-1 mb-3 transition-all duration-300 focus:border-[#C6A769] focus:shadow-md hover:border-[#C6A769] outline-none"
                                maxlength="5"
                            />
                            <p v-if="paymentErrors.expiryDate" class="text-red-500 text-sm mt-1 animate-pulse">
                                {{ paymentErrors.expiryDate || '' }}
                            </p>
                        </div>

                        <div class="group">
                            <input
                                v-model="cvv"
                                placeholder="CVV"
                                class="border border-gray-300 p-3 w-full mt-1 mb-3 transition-all duration-300 focus:border-[#C6A769] focus:shadow-md hover:border-[#C6A769] outline-none"
                                maxlength="4"
                                type="password"
                            />
                            <p v-if="paymentErrors.cvv" class="text-red-500 text-sm mt-1 animate-pulse">
                                {{ paymentErrors.cvv || '' }}
                            </p>
                        </div>
                    </div>
                </div>

                <div v-if="paymentMethod === 'PayPal'">
                    <h2 class="font-['Cormorant_Garamond'] text-4xl text-[#1F3B2D] mb-6">
                        PayPal Payment
                    </h2>

                    <div class="group">
                        <input
                            v-model="paypalEmail"
                            placeholder="PayPal Email"
                            class="border border-gray-300 p-3 w-full transition-all duration-300 focus:border-[#C6A769] focus:shadow-md hover:border-[#C6A769] outline-none"
                        >
                        <p v-if="paymentErrors.paypalEmail" class="text-red-500 text-sm mt-1 animate-pulse">
                            {{ paymentErrors.paypalEmail || '' }}
                        </p>
                    </div>

                    <div class="group mt-4">
                        <div class="relative">
                            <input
                                v-model="paypalPassword"
                                :type="showPaypalPassword ? 'text' : 'password'"
                                placeholder="PayPal Password"
                                class="border border-gray-300 p-3 w-full pr-12 transition-all duration-300 focus:border-[#C6A769] focus:shadow-md hover:border-[#C6A769] outline-none"
                            >
                            <button
                                type="button"
                                @click="showPaypalPassword = !showPaypalPassword"
                                class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C6A769] transition duration-300 cursor-pointer"
                            >
                                <Eye v-if="!showPaypalPassword" class="w-5 h-5" />
                                <EyeOff v-else class="w-5 h-5" />
                            </button>
                        </div>
                        <p v-if="paymentErrors.paypalPassword" class="text-red-500 text-sm mt-1 animate-pulse">
                            {{ paymentErrors.paypalPassword || '' }}
                        </p>
                    </div>
                </div>

                <div class="flex gap-4 mt-8">
                    <button @click="showPaymentPopup = false" class="flex-1 border border-[#1F3B2D] cursor-pointer py-3 transition-all duration-300 hover:bg-gray-100 hover:scale-[1.02] active:scale-95">
                        Cancel
                    </button>

                    <button @click="confirmPayment" :disabled="isProcessing" class="flex-1 bg-[#1F3B2D] text-white py-3 cursor-pointer transition-all duration-300 hover:bg-[#2A4F3C] hover:scale-[1.02] hover:shadow-2xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ isProcessing ? 'Processing...' : 'Confirm Payment' }}
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>

<style>
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

.hover\:shadow-2xl:hover {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

button:active {
    transform: scale(0.95);
}

.country-select-wrapper .overflow-y-auto::-webkit-scrollbar,
.phone-country-wrapper .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.country-select-wrapper .overflow-y-auto::-webkit-scrollbar-track,
.phone-country-wrapper .overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f1f1;
}

.country-select-wrapper .overflow-y-auto::-webkit-scrollbar-thumb,
.phone-country-wrapper .overflow-y-auto::-webkit-scrollbar-thumb {
    background: #C6A769;
    border-radius: 3px;
}

.country-select-wrapper .overflow-y-auto::-webkit-scrollbar-thumb:hover,
.phone-country-wrapper .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #b39a5a;
}
</style>