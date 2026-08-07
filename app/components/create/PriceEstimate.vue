<script setup lang="ts">
import { computed } from 'vue'
import { getProductById, getFabricById, calculatePrice } from '~/config/products'

const props = defineProps<{
  productId: string | null
  fabricId: string | null
}>()

const { formatPrice } = useFormat()

const price = computed(() => {
  if (!props.productId || !props.fabricId) return 0
  return calculatePrice(props.productId, props.fabricId)
})

const visible = computed(() => props.productId !== null && props.fabricId !== null)

const productName = computed(() => {
  if (!props.productId) return ''
  return getProductById(props.productId)?.name ?? ''
})

const fabricName = computed(() => {
  if (!props.fabricId) return ''
  return getFabricById(props.fabricId)?.name ?? ''
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div v-if="visible" class="rounded-2xl bg-primary-50 px-5 py-4">
      <div class="flex items-center justify-between">
        <div class="flex flex-col">
          <span class="text-xs font-medium text-neutral-500">Итого от</span>
          <span class="text-2xl font-extrabold text-primary-700">{{ formatPrice(price) }}</span>
        </div>
        <div class="flex flex-col items-end gap-1">
          <span class="text-sm font-medium text-neutral-700">{{ productName }}</span>
          <span class="text-xs text-neutral-400">{{ fabricName }}</span>
        </div>
      </div>
    </div>
  </Transition>
</template>
