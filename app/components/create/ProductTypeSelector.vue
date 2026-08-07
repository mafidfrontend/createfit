<script setup lang="ts">
import { PRODUCTS } from '~/config/products'
import { PRODUCT_ICON_PATHS } from '~/config/icons'
import type { ProductType } from '~/types'
import AppSectionHeader from '~/components/AppSectionHeader.vue'

defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { formatPrice } = useFormat()

function select(product: ProductType) {
  emit('update:modelValue', product.id)
}
</script>

<template>
  <section>
    <AppSectionHeader
      :number="4"
      title="Выберите тип изделия"
      description="Выберите, что хотите создать"
    />

    <div class="grid grid-cols-2 gap-3">
      <button
        v-for="product in PRODUCTS"
        :key="product.id"
        class="flex flex-col items-center rounded-2xl border-2 p-4 transition-all duration-200 tap-scale"
        :class="
          modelValue === product.id
            ? 'border-primary-600 bg-primary-50'
            : 'border-neutral-200 bg-white active:border-neutral-300'
        "
        :aria-pressed="modelValue === product.id"
        @click="select(product)"
      >
        <div
          class="flex h-16 w-16 items-center justify-center rounded-2xl"
          :class="modelValue === product.id ? 'bg-primary-100' : 'bg-neutral-100'"
        >
          <svg
            class="h-8 w-8"
            :class="modelValue === product.id ? 'text-primary-600' : 'text-neutral-500'"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path :d="PRODUCT_ICON_PATHS[product.icon] ?? ''" />
          </svg>
        </div>
        <span class="mt-3 text-sm font-bold text-neutral-900">{{ product.name }}</span>
        <span class="mt-0.5 text-xs text-neutral-400">от {{ formatPrice(product.basePrice) }}</span>
      </button>
    </div>
  </section>
</template>
