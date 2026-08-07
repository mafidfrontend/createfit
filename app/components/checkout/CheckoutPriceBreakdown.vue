<script setup lang="ts">
import { useFormat } from '~/composables/useFormat'

defineProps<{
  subtotal: number
  deliveryPrice: number
  discount: number
  total: number
  promoCode: string | null
}>()

const { formatPrice } = useFormat()
</script>

<template>
  <div class="rounded-2xl bg-neutral-50 p-4">
    <h3 class="mb-3 text-sm font-bold text-neutral-900">Стоимость заказа</h3>

    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-sm text-neutral-500">Товары</span>
        <span class="text-sm font-medium text-neutral-900">{{ formatPrice(subtotal) }}</span>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-sm text-neutral-500">Доставка</span>
        <span class="text-sm font-medium text-neutral-900">
          {{ deliveryPrice === 0 ? 'Бесплатно' : formatPrice(deliveryPrice) }}
        </span>
      </div>

      <div v-if="discount > 0" class="flex items-center justify-between">
        <span class="text-sm text-neutral-500">
          Скидка{{ promoCode ? ` (${promoCode})` : '' }}
        </span>
        <span class="text-sm font-semibold text-success-600">−{{ formatPrice(discount) }}</span>
      </div>
    </div>

    <div class="my-3 border-t border-neutral-200" />

    <div class="flex items-center justify-between">
      <span class="text-base font-bold text-neutral-900">Итого</span>
      <span class="text-xl font-extrabold text-primary-700">{{ formatPrice(total) }}</span>
    </div>
  </div>
</template>
