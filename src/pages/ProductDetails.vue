<script setup>
import { watch, computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { productService } from '../api/productService'
import { addToCart } from '../stores/cart'
import { formatPrice } from '../stores/currency'
import { toggleWishlist, isInWishlist, loadWishlist } from '../stores/wishlist'
import StockBadge from '../components/StockBadge.vue'

const route = useRoute()

const product = ref(null)
const loading = ref(true)
const error = ref(null)

const selectedSize = ref(null)

const reviewName = ref('')
const reviewText = ref('')
const reviewRating = ref(0)
const reviewImage = ref('')
const showReviewForm = ref(false)

const reviews = ref([])

const fetchProduct = async (productId) => {
    loading.value = true
    error.value = null
    
    try {
        const data = await productService.getProduct(productId)
        
        if (data) {
            product.value = productService.transformProduct(data)
            
            let viewed = JSON.parse(localStorage.getItem('recentlyViewed')) || []
            viewed = viewed.filter(item => item.id !== product.value.id)
            viewed.unshift(product.value)
            viewed = viewed.slice(0, 4)
            localStorage.setItem('recentlyViewed', JSON.stringify(viewed))
        } else {
            error.value = 'Product not found'
        }
    } catch (err) {
        console.error('Error fetching product:', err)
        error.value = 'Failed to load product'
    } finally {
        loading.value = false
    }
}

const loadReviews = (productId) => {
    const storedReviews = JSON.parse(
        localStorage.getItem(`reviews-${productId}`)
    ) || []
    reviews.value = storedReviews
}

const loadProduct = (productId) => {
    fetchProduct(productId)
    loadReviews(productId)
    selectedSize.value = null
}

onMounted(async () => {
    await loadWishlist()
    loadProduct(route.params.id)
})
watch(
    () => route.params.id,
    (newId) => {
        if (newId) {
            loadProduct(newId)
        }
    }
)

const recentlyViewed = computed(() => {
    return (
        JSON.parse(
            localStorage.getItem(
                'recentlyViewed'
            )
        ) || []
    ).filter(
        item => item.id !== product.value?.id
    )
})

const inWishlist = computed(() => {
    if (!product.value) return false
    return isInWishlist(product.value.id)
})

const handleAddToCart = async () => {

    if (product.value.sizes.length > 0 && !selectedSize.value) {
        return
    }

    const selectedVariant =
        product.value.variants.find(v => {
            if (product.value.sizes.length === 0) return true
            return v.values?.[0]?.name === selectedSize.value
        }) || product.value.variants[0]

    await addToCart({
        ...product.value,
        variant_id: selectedVariant.id,
        size: selectedSize.value || null
    })
}

function submitReview() {
    if (
        !reviewName.value ||
        !reviewText.value ||
        !reviewRating.value
    ) {
        return
    }

    reviews.value.unshift({
        name: reviewName.value,
        text: reviewText.value,
        rating: reviewRating.value,
        image: reviewImage.value,
        date: new Date().toLocaleDateString()
    })

    localStorage.setItem(
        `reviews-${route.params.id}`,
        JSON.stringify(reviews.value)
    )

    reviewName.value = ''
    reviewText.value = ''
    reviewRating.value = 0
    reviewImage.value = ''
}

const averageRating = computed(() => {
    if (!reviews.value.length) return 0
    const total = reviews.value.reduce(
        (sum, review) => sum + review.rating,
        0
    )
    return (total / reviews.value.length).toFixed(1)
})

function handleReviewImage(event) {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
        reviewImage.value = reader.result
    }
    reader.readAsDataURL(file)
}
</script>

<template>
    <section class="bg-[#F5F2EB] min-h-screen py-24">
        <div class="max-w-7xl mx-auto px-8">
            <div v-if="loading" class="flex justify-center items-center h-96">
                <div class="text-xl text-[#1F3B2D]">Loading product...</div>
            </div>

            <div v-else-if="error" class="flex justify-center items-center h-96">
                <div class="text-xl text-red-500">{{ error }}</div>
            </div>

            <template v-else-if="product">
                <div class="border-b border-gray-300 pb-4 mb-10 pl-10">
                    <div class="flex items-center gap-5 uppercase tracking-[0.3em] text-sm">
                        <router-link
                            to="/"
                            class="hover:text-[#C6A769] transition duration-300"
                        >
                            Home
                        </router-link>
                        <span>/</span>
                        <router-link
                            to="/shop"
                            class="hover:text-[#C6A769] transition duration-300"
                        >
                            Shop
                        </router-link>
                        <span>/</span>
                        <span class="text-[#C6A769]">
                            {{ product.name }}
                        </span>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-20 items-start">
                    <div class="flex justify-center">
                        <div
                            class="group bg-white p-6 border border-transparent
                                hover:border-[#C6A769]
                                shadow-sm hover:shadow-xl
                                hover:-translate-y-1
                                transition-all duration-500
                                w-[85%]"
                        >
                            <div class="overflow-hidden">
                                <img
                                    :src="product.image"
                                    :alt="product.name"
                                    class="w-full max-h-[650px] object-cover
                                        transition duration-700
                                        group-hover:scale-105"
                                >
                            </div>
                        </div>
                    </div>

                    <div>
                        <p class="uppercase tracking-[0.3em] text-[#C6A769] text-sm">
                            {{ product.category || 'Product' }}
                        </p>

                        <h1
                            class="font-['Cormorant_Garamond']
                                text-6xl
                                text-[#1F3B2D]
                                mt-4
                                leading-none
                                transition-colors duration-300
                                hover:text-[#C6A769]"
                        >
                            {{ product.name }}
                        </h1>

                        <div class="mt-4">
                            <StockBadge :stock="product.stock" size="lg" />
                        </div>

                        <p
                            class="text-3xl text-[#1F3B2D] mt-6
                                transition duration-300
                                hover:text-[#C6A769]"
                        >
                            {{ formatPrice(product.price) }}
                        </p>

                        <p class="text-gray-600 mt-8">
                            {{ product.details || product.category }}
                        </p>

                        <p 
                            class="text-[#4A5A52] leading-8 mt-8 max-w-xl" 
                            v-html="product.description"
                        >
                        </p>
                        
                        <div class="mt-8" v-if="product.features && product.features.length">
                            <h3 class="uppercase tracking-[0.3em] text-sm text-[#C6A769] mb-4">
                                Features
                            </h3>

                            <ul class="space-y-2">
                                <li
                                    v-for="feature in product.features"
                                    :key="feature"
                                    class="text-[#4A5A52]"
                                >
                                    ✓ {{ feature }}
                                </li>
                            </ul>
                        </div>

                        <hr class="my-8 border-gray-300">

                        <div v-if="product.sizes && product.sizes.length" class="mt-8">
                            <h3 class="uppercase tracking-widest text-sm mb-4">
                                Select Size
                            </h3>

                            <div class="flex gap-3 flex-wrap">
                                <button
                                    v-for="size in product.sizes"
                                    :key="size"
                                    @click="selectedSize = size"
                                    :class="[
                                        'w-14 h-14 border text-sm transition duration-300 cursor-pointer',
                                        selectedSize === size
                                            ? 'bg-[#1F3B2D] text-white'
                                            : 'border-[#1F3B2D] hover:bg-[#1F3B2D] hover:text-white'
                                    ]"
                                >
                                    {{ size }}
                                </button>
                            </div>
                            <p v-if="selectedSize" class="mt-4 text-sm text-[#4A5A52]">
                                Selected Size: <span class="font-medium">{{ selectedSize }}</span>
                            </p>
                        </div>

                        <div class="flex items-center gap-4 mt-8">
                            <div class="group relative inline-block">
                                <button
                                    @click="handleAddToCart"
                                    :disabled="product.sizes && product.sizes.length && !selectedSize"
                                    :class="[
                                        'px-10 py-4 uppercase tracking-[0.3em] transition duration-300',
                                        product.sizes && product.sizes.length && !selectedSize
                                            ? 'bg-gray-400 cursor-not-allowed text-white'
                                            : 'bg-[#1F3B2D] text-white hover:bg-[#2C4D3A] cursor-pointer'
                                    ]"
                                >
                                    Add to Cart
                                </button>

                                <div
                                    v-if="product.sizes && product.sizes.length && !selectedSize"
                                    class="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-3
                                    opacity-0 group-hover:opacity-100
                                    transition duration-300
                                    bg-[#1F3B2D] text-white text-xs
                                    px-3 py-2 rounded-md whitespace-nowrap"
                                >
                                    Select a size to continue
                                </div>
                            </div>

                            <div class="group relative">
                                <button
                                    @click="toggleWishlist(product)"
                                    class="
                                    w-12 h-12
                                    flex items-center justify-center
                                    rounded-full
                                    border border-[#C6A769]
                                    text-[#C6A769]
                                    hover:bg-[#C6A769]
                                    hover:text-white
                                    transition-all duration-300
                                    cursor-pointer
                                    text-xl
                                    "
                                >
                                    {{ inWishlist ? '♥' : '♡' }}
                                </button>

                                <div
                                    class="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-3
                                    opacity-0 group-hover:opacity-100
                                    transition duration-300
                                    bg-[#1F3B2D] text-white text-xs
                                    px-3 py-2 rounded-md whitespace-nowrap"
                                >
                                    {{ inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist' }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <div
            v-if="recentlyViewed.length"
            class="max-w-7xl mx-auto px-8 mt-24"
        >
            <h2
                class="
                font-['Cormorant_Garamond']
                text-5xl text-[#1F3B2D]
                mb-10
                "
            >
                Recently Viewed
            </h2>

            <div
                class="
                grid md:grid-cols-3
                gap-8
                "
            >
                <router-link
                    v-for="item in recentlyViewed"
                    :key="item.id"
                    :to="`/product/${item.id}`"
                    class="
                    bg-white
                    border border-gray-200
                    hover:border-[#C6A769]
                    hover:shadow-lg
                    transition duration-300
                    overflow-hidden
                    "
                >
                    <img
                        :src="item.image"
                        :alt="item.name"
                        class="
                        h-[300px]
                        w-full
                        object-cover
                        "
                    >

                    <div class="p-5">
                        <h3
                            class="
                            font-['Cormorant_Garamond']
                            text-3xl
                            text-[#1F3B2D]
                            "
                        >
                            {{ item.name }}
                        </h3>

                        <p
                            class="
                            mt-3
                            text-[#C6A769]
                            "
                        >
                            {{ formatPrice(item.price) }}
                        </p>
                    </div>
                </router-link>
            </div>
        </div>

        <div class="max-w-4xl mx-auto mt-24 px-8">
            <div class="text-center">
                <h2
                    class="
                    font-['Cormorant_Garamond']
                    text-5xl
                    text-[#1F3B2D]
                    "
                >
                    Customer Reviews
                </h2>

                <p
                    class="
                    mt-4
                    text-[#C6A769]
                    text-xl
                    "
                >
                    ★ {{ averageRating }}
                    ({{ reviews.length }} Reviews)
                </p>

                <button
                    @click="showReviewForm = true"
                    class="
                    mt-8
                    bg-[#1F3B2D]
                    text-white
                    px-8 py-4
                    uppercase
                    tracking-[0.2em]
                    hover:bg-[#2C4D3A]
                    transition
                    cursor-pointer
                    "
                >
                    Write A Review
                </button>
            </div>

            <div
                v-if="!reviews.length"
                class="
                text-center
                mt-12
                text-gray-500
                italic
                "
            >
                No reviews yet.
                Be the first to share your experience.
            </div>

            <div
                v-if="reviews.length"
                class="
                mt-12
                space-y-6
                "
            >
                <div
                    v-for="review in reviews"
                    :key="review.date + review.name"
                    class="
                    bg-white
                    border border-gray-200
                    hover:border-[#C6A769]
                    transition
                    p-8
                    "
                >
                    <div
                        class="
                        text-[#C6A769]
                        text-2xl
                        "
                    >
                        {{ '★'.repeat(review.rating) }}
                    </div>

                    <h4
                        class="
                        mt-3
                        text-[#1F3B2D]
                        font-medium
                        "
                    >
                        {{ review.name }}
                    </h4>

                    <p
                        class="
                        mt-4
                        text-[#4A5A52]
                        leading-7
                        "
                    >
                        {{ review.text }}
                    </p>

                    <img
                        v-if="review.image"
                        :src="review.image"
                        class="
                        mt-4
                        w-52
                        h-52
                        object-cover
                        rounded-md
                        border
                        "
                    >

                    <p
                        class="
                        mt-4
                        text-gray-400
                        text-sm
                        "
                    >
                        {{ review.date }}
                    </p>
                </div>
            </div>
        </div>

        <div
            v-if="showReviewForm"
            class="
            fixed inset-0
            bg-black/40
            flex items-center justify-center
            z-50
            "
        >
            <div
                class="
                bg-white
                w-full max-w-2xl
                p-10
                shadow-xl
                "
            >
                <h2
                    class="
                    font-['Cormorant_Garamond']
                    text-5xl
                    text-[#1F3B2D]
                    "
                >
                    Write A Review
                </h2>

                <input
                    v-model="reviewName"
                    placeholder="Your Name"
                    class="
                    border
                    p-4
                    w-full
                    mt-8
                    "
                >

                <textarea
                    v-model="reviewText"
                    rows="5"
                    placeholder="Tell us about your experience..."
                    class="
                    border
                    p-4
                    w-full
                    mt-4
                    "
                ></textarea>

                <label
                    class="
                    mt-4
                    w-full
                    flex
                    justify-center
                    items-center
                    py-4
                    border-2 border-dashed
                    border-[#C6A769]
                    text-[#C6A769]
                    cursor-pointer
                    hover:bg-[#C6A769]/10
                    transition-all duration-300
                    "
                >
                    <div class="text-center">
                        <p class="uppercase tracking-[0.3em] text-sm">
                            Upload Product Photo
                        </p>

                        <p class="mt-2 text-xs text-gray-500">
                            JPG, PNG • Max 2MB
                        </p>
                    </div>

                    <input
                        type="file"
                        accept="image/*"
                        @change="handleReviewImage"
                        class="hidden"
                    >
                </label>

                <img
                    v-if="reviewImage"
                    :src="reviewImage"
                    class="
                    mt-4
                    w-40
                    h-40
                    object-cover
                    border
                    "
                >

                <div
                    class="
                    flex gap-2
                    mt-6
                    "
                >
                    <button
                        v-for="star in 5"
                        :key="star"
                        @click="reviewRating = star"
                        class="
                        text-4xl
                        cursor-pointer
                        transition
                        "
                        :class="
                            star <= reviewRating
                            ? 'text-[#C6A769]'
                            : 'text-gray-300'
                        "
                    >
                        ★
                    </button>
                </div>

                <div
                    class="
                    flex gap-4
                    mt-10
                    "
                >
                    <button
                        @click="
                            showReviewForm = false,
                            reviewName = '',
                            reviewText = '',
                            reviewRating = 0,
                            reviewImage = '',
                            reviewImageName = ''
                        "
                        class="
                        flex-1
                        border
                        py-4
                        cursor-pointer
                        "
                    >
                        Cancel
                    </button>

                    <button
                        @click="
                            submitReview();
                            showReviewForm = false;
                        "
                        class="
                        flex-1
                        bg-[#1F3B2D]
                        text-white
                        py-4
                        cursor-pointer
                        "
                    >
                        Submit Review
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>