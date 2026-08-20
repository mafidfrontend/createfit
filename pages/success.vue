<template>
  <div class="slide-up pb-8 pt-10 text-center">
    <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-mint text-3xl font-bold text-sage">✓</div>
    <p class="mt-7 text-xs font-bold uppercase tracking-[.2em] text-sage">Готово</p>
    <h1 class="mt-3 text-4xl font-bold tracking-tight">Заказ оформлен</h1>
    <p class="mt-4 text-sm leading-6 text-ink/55">Мы получили детали и свяжемся с тобой, если понадобится уточнение.</p>
    <div v-if="created" class="mt-8 rounded-2xl bg-white p-5 text-left shadow-soft">
      <div class="flex justify-between"><span class="text-sm text-ink/55">Номер заказа</span><b class="text-sage">#{{ created.id }}</b></div>
      <p class="mt-5 rounded-xl bg-mint px-3 py-3 text-sm font-bold text-sage">Срок изготовления: 7 дней</p>
    </div>
    <div class="mt-8"><PrimaryButton @click="backHome">На главную</PrimaryButton></div>
  </div>
</template>
<script setup lang="ts">
useSeoMeta({ robots: 'noindex, nofollow' })
const order = useOrderStore()
const created = computed(() => order.createdOrder)
function backHome(): void { order.reset(); navigateTo('/') }
</script>
