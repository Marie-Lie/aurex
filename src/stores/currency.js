import { ref } from 'vue'

export const selectedCurrency = ref(
    localStorage.getItem('currency') || 'USD'
)

export function setCurrency(currency) {

    selectedCurrency.value = currency

    localStorage.setItem(
        'currency',
        currency
    )
}

export function formatPrice(price) {

    if (selectedCurrency.value === 'EUR') {
        return `€${(price * 0.92).toFixed(0)}`
    }

    if (selectedCurrency.value === 'LBP') {
        return `${((price * 89500) / 1000000).toFixed(2)}M LBP`
    }

    return `$${price}`
}