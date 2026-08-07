<script setup lang="ts">
import { PAYMENT_ICON_PATHS } from '~/config/icons'
import { PAYMENT_METHODS } from '~/config/checkout'
import type { PaymentMethodId } from '~/types'

defineProps<{
  modelValue: PaymentMethodId
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PaymentMethodId]
}>()
</script>

<template>
  <div class="space-y-2">
    <button
      v-for="method in PAYMENT_METHODS"
      :key="method.id"
      class="flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-200 tap-scale"
      :class="modelValue === method.id ? 'border-primary-600 bg-primary-50' : 'border-neutral-200 bg-white active:bg-neutral-50'"
      :aria-pressed="modelValue === method.id"
      @click="emit('update:modelValue', method.id)"
    >
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors"
        :class="modelValue === method.id ? 'bg-primary-600' : 'bg-neutral-100'"
      >
        <svg
          class="h-5 w-5"
          :class="modelValue === method.id ? 'text-white' : 'text-neutral-500'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path :d="PAYMENT_ICON_PATHS[method.icon] ?? ''" />
        </svg>
      </div>

      <div class="flex flex-1 flex-col">
        <span class="text-sm font-bold text-neutral-900">{{ method.name }}</span>
        <span class="text-xs text-neutral-500">{{ method.description }}</span>
      </div>

      <div
        class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
        :class="modelValue === method.id ? 'border-primary-600 bg-primary-600' : 'border-neutral-300'"
      >
        <svg v-if="modelValue === method.id" class="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
    </button>
  </div>
</template>
