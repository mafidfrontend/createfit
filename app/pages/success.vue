<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '~/components/AppHeader.vue'
import AppButton from '~/components/AppButton.vue'
import BrandFooter from '~/components/BrandFooter.vue'
import { useFormat } from '~/composables/useFormat'
import { getDeliveryById, getPaymentById } from '~/config/checkout'
import { BRAND_TEXT } from '~/config/navigation'

const router = useRouter()
const orderStore = useOrderStore()
const { formatPrice } = useFormat()

const order = computed(() => orderStore.current)
const hasOrder = computed(() => order.value !== null)

const deliveryName = computed(() => {
  if (!order.value) return ''
  return getDeliveryById(order.value.deliveryMethod)?.name ?? ''
})

const paymentName = computed(() => {
  if (!order.value) return ''
  return getPaymentById(order.value.paymentMethod)?.name ?? ''
})

const orderNumber = computed(() => {
  if (!order.value) return ''
  return order.value.id.slice(0, 8).toUpperCase()
})

onMounted(() => {
  if (!orderStore.isConfirmed) {
    router.replace('/')
  }
})

function goHome() {
  router.push('/')
}

function createNew() {
  router.push('/create')
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <AppHeader show-back @back="goHome" />

    <main class="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center">
      <Transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="opacity-0 scale-75"
        enter-to-class="opacity-100 scale-100"
        appear
      >
        <div class="flex h-24 w-24 items-center justify-center rounded-full bg-success-500 shadow-lg shadow-success-500/30">
          <svg class="h-12 w-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      </Transition>

      <h1 class="mt-6 text-2xl font-extrabold text-neutral-900">Заказ оформлен!</h1>
      <p class="mt-2 text-sm text-neutral-500">
        Спасибо за заказ. Мы свяжемся с вами для подтверждения.
      </p>

      <div v-if="hasOrder && order" class="mt-8 w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-5 text-left">
        <div class="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3">
          <span class="text-xs text-neutral-500">Номер заказа</span>
          <span class="text-sm font-bold text-neutral-900">#{{ orderNumber }}</span>
        </div>

        <div class="space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs text-neutral-500">Товаров</span>
            <span class="text-sm font-medium text-neutral-900">{{ order.items.length }} шт</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-neutral-500">Доставка</span>
            <span class="text-sm font-medium text-neutral-900">{{ deliveryName }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-neutral-500">Оплата</span>
            <span class="text-sm font-medium text-neutral-900">{{ paymentName }}</span>
          </div>
          <div v-if="order.promoCode" class="flex items-center justify-between">
            <span class="text-xs text-neutral-500">Промокод</span>
            <span class="text-sm font-medium text-success-600">{{ order.promoCode }}</span>
          </div>
        </div>

        <div class="my-3 border-t border-neutral-100" />

        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-neutral-900">Итого</span>
          <span class="text-xl font-extrabold text-primary-700">{{ formatPrice(order.total) }}</span>
        </div>
      </div>

      <p class="mt-6 text-xs text-neutral-400">
        Подтверждение отправлено на ваш email
      </p>

      <div class="mt-8 w-full max-w-sm space-y-3">
        <AppButton variant="primary" size="lg" full-width @click="createNew">
          Создать новый дизайн
        </AppButton>
        <AppButton variant="outline" size="lg" full-width @click="goHome">
          На главную
        </AppButton>
      </div>

      <div class="mt-8">
        <BrandFooter />
      </div>
    </main>
  </div>
</template>
