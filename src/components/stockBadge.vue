<script setup>
import { computed } from 'vue'

const props = defineProps({
  stock: {
    type: Number,
    default: 0
  },
  size: {
    type: String,
    default: 'md'
  }
})

const status = computed(() => {
  if (props.stock <= 0) return 'out-of-stock'
  if (props.stock <= 3) return 'low-stock'
  return 'in-stock'
})

const label = computed(() => {
  if (props.stock <= 0) return 'Out of Stock'
  if (props.stock <= 3) return `${props.stock} left`
  return 'In Stock'
})

const sizeClasses = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-3 py-1',
  lg: 'text-sm px-4 py-1.5'
}

const colorClasses = {
  'in-stock': 'bg-green-100 text-green-800 border-green-200',
  'low-stock': 'bg-orange-100 text-orange-800 border-orange-200',
  'out-of-stock': 'bg-red-100 text-red-800 border-red-200'
}

const dotColors = {
  'in-stock': 'bg-green-500',
  'low-stock': 'bg-orange-500',
  'out-of-stock': 'bg-red-500'
}
</script>

<template>
  <div 
    class="inline-flex items-center gap-2 rounded-full border font-medium transition-all duration-300"
    :class="[sizeClasses[size], colorClasses[status]]"
  >
    <span 
      class="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
      :class="dotColors[status]"
    ></span>
    {{ label }}
  </div>
</template>