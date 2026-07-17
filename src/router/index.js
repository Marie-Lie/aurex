import { createRouter, createWebHistory } from 'vue-router'

import Home from '../pages/Home.vue'
import Shop from '../pages/Shop.vue'
import ProductDetails from '../pages/ProductDetails.vue'
import About from '../pages/About.vue'
import Contact from '../pages/Contact.vue'
import Profile from '../pages/Profile.vue'
import OrderHistory from '../pages/OrderHistory.vue'
import Checkout from '../pages/Checkout.vue'
import ShippingReturns from '../pages/ShippingReturns.vue'
import Wishlist from '../pages/Wishlist.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'Home',
            component: Home
        },

        {
            path: '/shop',
            name: 'Shop',
            component: Shop
        },

        {
            path: '/product/:id',
            name: 'ProductDetails',
            component: ProductDetails
        },

        {
            path: '/About',
            name: 'About',
            component: About
        },

        {
            path: '/Contact',
            name: 'Contact',
            component: Contact
        },

        {
            path: '/Profile',
            name: 'Profile',
            component: Profile
        },

        {
            path: '/OrderHistory',
            name: 'OrderHistory',
            component: OrderHistory
        },

        {
            path: '/Checkout',
            name: 'Checkout',
            component: Checkout
        },
        
        {
            path: '/ShippingReturns',
            name: 'ShippingReturns',
            component: ShippingReturns
        },

        {
            path: '/Wishlist',
            name: 'Wishlist',
            component: Wishlist
        }
    ],

      scrollBehavior() {
        return {
            top: 0
        }
    }
})

export default router