<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useWizardStore } from '~/stores/wizard'
import { useFormat } from '~/composables/useFormat'
import { MANUFACTURING_DAYS } from '~/types/wizard'

const router = useRouter()
const wizard = useWizardStore()
const { formatPrice } = useFormat()

const orderNumber = computed(() => wizard.order.orderNumber ?? '')
const total = computed(() => wizard.order.pricing.total)

onMounted(() => {
  if (!wizard.isConfirmed) {
    router.replace('/')
  }
})

function goHome() {
  router.push('/')
}

function startNew() {
  wizard.reset()
  router.push('/order')
}
</script>

<template>
  <div class="flex flex-1 flex-col">
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

      <h1 class="mt-6 text-2xl font-extrabold text-neutral-900">Заказ оформлен</h1>
      <p class="mt-2 text-sm text-neutral-500">
        Срок изготовления: {{ MANUFACTURING_DAYS }} дней
      </p>

      <div v-if="orderNumber" class="mt-8 w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-5 text-left">
        <div class="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3">
          <span class="text-xs text-neutral-500">Номер заказа</span>
          <span class="text-sm font-bold text-neutral-900">{{ orderNumber }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-neutral-900">Итого</span>
          <span class="text-xl font-extrabold text-neutral-900">{{ formatPrice(total) }}</span>
        </div>
        <div class="mt-3 border-t border-neutral-100 pt-3">
          <p class="text-xs text-neutral-500">Оплата: ожидает подтверждения в Telegram Bot</p>
        </div>
      </div>

      <div class="mt-8 w-full max-w-sm space-y-3">
        <button
          class="w-full rounded-2xl bg-neutral-900 py-4 text-base font-bold text-white transition-opacity active:opacity-80"
          @click="startNew"
        >
          Новый заказ
        </button>
        <button
          class="w-full rounded-2xl border border-neutral-200 py-4 text-base font-semibold text-neutral-700 transition-colors active:bg-neutral-50"
          @click="goHome"
        >
          На главную
        </button>
      </div>
    </main>
  </div>
</template>
