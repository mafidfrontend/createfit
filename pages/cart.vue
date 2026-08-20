<template>
  <div class="slide-up pb-8">
    <StepHeader :step="5" eyebrow="Доставка" title="Куда доставить?" description="Укажи адрес, и мы сообщим, когда заказ будет готов." />
    <div class="space-y-4">
      <label class="block text-sm font-bold">Город<input v-model="city" class="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-4 text-sm outline-none focus:border-sage" placeholder="Например, Ташкент" /></label>
      <label class="block text-sm font-bold">Полный адрес<textarea v-model="address" class="mt-2 min-h-24 w-full resize-none rounded-2xl border border-line bg-white px-4 py-4 text-sm outline-none focus:border-sage" placeholder="Улица, дом, квартира" /></label>
      <label class="block text-sm font-bold">Комментарий <span class="font-normal text-ink/45">(необязательно)</span><textarea v-model="comment" class="mt-2 min-h-20 w-full resize-none rounded-2xl border border-line bg-white px-4 py-4 text-sm outline-none focus:border-sage" placeholder="Например, позвонить перед доставкой" /></label>
    </div>
    <div class="mt-7">
      <OrderRecap />
      <div class="mt-3 flex justify-between rounded-2xl border border-line bg-white px-4 py-4 text-sm"><span>Доставка</span><b>{{ formatUsd(order.draft.deliveryPrice) }}</b></div>
      <p class="mt-5 text-sm font-bold text-sage">Срок изготовления: 7 дней</p>
    </div>
    <p v-if="error" class="mt-3 text-sm text-terracotta">{{ error }}</p>
    <BackNext back-to="/measurements" :disabled="!city.trim() || !address.trim()" next-label="Оформить заказ" :loading="loading" @next="submit" />
  </div>
</template>
<script setup lang="ts">
import { formatUsd } from '~/utils/pricing'
const order = useOrderStore()
const city = ref(order.draft.delivery.city)
const address = ref(order.draft.delivery.address)
const comment = ref(order.draft.delivery.comment)
const error = ref('')
const loading = ref(false)

watch([city, address, comment], () => order.setDelivery({ city: city.value, address: address.value, comment: comment.value }))

async function submit(): Promise<void> {
  if (!city.value.trim() || !address.value.trim()) { error.value = 'Введите город и адрес доставки'; return }
  loading.value = true
  error.value = ''
  try {
    const created = await $fetch('/api/orders', { method: 'POST', body: order.draft })
    order.setCreatedOrder(created)
    await navigateTo('/success')
  } catch (requestError: unknown) {
    error.value = requestError instanceof Error ? requestError.message : 'Не удалось оформить заказ. Попробуйте ещё раз.'
  } finally {
    loading.value = false
  }
}
</script>
