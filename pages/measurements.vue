<template>
  <div class="slide-up pb-8">
    <StepHeader :step="4" eyebrow="Размер" title="Твоя посадка" description="Выбери стандартный размер или укажи свои мерки." />
    <div class="grid grid-cols-4 gap-2">
      <button v-for="size in STANDARD_SIZES" :key="size" class="rounded-xl border bg-white py-3 text-sm font-bold transition" :class="order.draft.size?.standardSize === size ? 'border-sage bg-mint text-sage' : 'border-line'" @click="selectStandard(size)">{{ size }}</button>
    </div>
    <button class="mt-4 w-full rounded-2xl border bg-white p-4 text-left text-sm font-bold transition" :class="order.draft.size?.type === 'custom' ? 'border-sage bg-mint text-sage' : 'border-line'" @click="selectCustom">Индивидуальный размер</button>
    <div v-if="order.draft.size?.type === 'custom'" class="mt-4 rounded-2xl border border-line bg-white p-4">
      <p class="mb-4 text-sm font-bold">Укажи мерки в сантиметрах</p>
      <div class="grid grid-cols-2 gap-3">
        <label v-for="field in measurementFields" :key="field.key" class="text-xs font-semibold text-ink/55">
          {{ field.label }}
          <input v-model="measurements[field.key]" class="mt-2 w-full rounded-xl border border-line bg-cream px-3 py-3 text-sm text-ink outline-none focus:border-sage" type="text" inputmode="decimal" />
        </label>
      </div>
    </div>
    <p class="mt-6 text-sm font-bold text-sage">Срок изготовления: 7 дней</p>
    <PriceSummary :product-price="order.draft.product?.basePrice ?? 0" :fabric-price="order.draft.fabric?.additionalPrice ?? 0" :delivery-price="order.draft.deliveryPrice" :total="order.draft.totalPrice" />
    <p v-if="error" class="mt-3 text-sm text-terracotta">{{ error }}</p>
    <BackNext back-to="/design" :disabled="!order.hasSize" @next="goNext" />
  </div>
</template>

<script setup lang="ts">
import { STANDARD_SIZES } from '~/config/catalog'
import type { CustomMeasurements } from '~/types/order'

const order = useOrderStore()
const error = ref('')
const measurementFields: { key: keyof CustomMeasurements; label: string }[] = [
  { key: 'height', label: 'Рост' },
  { key: 'chest', label: 'Грудь' },
  { key: 'waist', label: 'Талия' },
  { key: 'hips', label: 'Бёдра' },
  { key: 'length', label: 'Длина изделия' },
  { key: 'sleeve', label: 'Длина рукава' }
]
const measurements = reactive<CustomMeasurements>({ height: '', chest: '', waist: '', hips: '', length: '', sleeve: '', other: '' })

function selectStandard(size: string): void {
  order.setSize({ type: 'standard', standardSize: size, customMeasurements: null })
}

function selectCustom(): void {
  order.setSize({ type: 'custom', standardSize: null, customMeasurements: { ...measurements } })
}

watch(measurements, () => {
  if (order.draft.size?.type === 'custom') order.setSize({ type: 'custom', standardSize: null, customMeasurements: { ...measurements } })
})

function goNext(): void {
  if (!order.hasSize) {
    error.value = 'Выберите размер или заполните Рост и Грудь'
    return
  }
  navigateTo('/checkout')
}
</script>
