<script setup lang="ts">
import { computed } from 'vue'
import { getProductById, getFabricById } from '~/config/products'
import { useFormat } from '~/composables/useFormat'
import type { CartItem } from '~/types'

const props = defineProps<{
  item: CartItem
}>()

const emit = defineEmits<{
  remove: []
  updateQuantity: [quantity: number]
}>()

const { formatPrice } = useFormat()
const designStore = useDesignStore()

const product = computed(() => (props.item.productId ? getProductById(props.item.productId) : undefined))
const design = computed(() => {
  return designStore.history.find((d) => d.id === props.item.designId) ?? designStore.current
})
const fabric = computed(() => {
  const fabricId = design.value?.fabricId
  return fabricId ? getFabricById(fabricId) : undefined
})
const previewImage = computed(() => design.value?.frontImage ?? null)
const total = computed(() => props.item.price * props.item.quantity)
</script>

<template>
  <div class="rounded-2xl border border-neutral-200 bg-white p-4">
    <div class="flex gap-3">
      <div class="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
        <img v-if="previewImage" :src="previewImage" :alt="product?.name ?? 'Товар'" class="h-full w-full object-cover" />
        <div v-else class="flex h-full w-full items-center justify-center">
          <svg class="h-8 w-8 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 16V4M5 11l7-7 7 7M5 20h14" />
          </svg>
        </div>
      </div>

      <div class="flex flex-1 flex-col">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-sm font-bold text-neutral-900">{{ product?.name ?? 'Товар' }}</span>
            <span class="ml-2 text-xs text-neutral-400">Размер {{ item.size }}</span>
          </div>
          <button
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors active:bg-neutral-100 active:text-neutral-600"
            aria-label="Удалить"
            @click="emit('remove')"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <span v-if="fabric" class="mt-0.5 text-xs text-neutral-500">{{ fabric.name }}</span>

        <div class="mt-auto flex items-center justify-between pt-2">
          <div class="flex items-center gap-2">
            <button
              class="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors active:bg-neutral-100"
              aria-label="Уменьшить"
              @click="emit('updateQuantity', item.quantity - 1)"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                <path d="M5 12h14" />
              </svg>
            </button>
            <span class="min-w-[24px] text-center text-sm font-semibold text-neutral-900">{{ item.quantity }}</span>
            <button
              class="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors active:bg-neutral-100"
              aria-label="Увеличить"
              @click="emit('updateQuantity', item.quantity + 1)"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
          <span class="text-sm font-extrabold text-neutral-900">{{ formatPrice(total) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
