<template>
  <nav class="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[430px] -translate-x-1/2 items-center justify-around border-t border-line bg-white/96 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
    <NuxtLink v-for="item in items" :key="item.to" :to="item.to" class="flex min-w-16 flex-col items-center gap-1 text-[11px] font-semibold transition" :class="$route.path === item.to ? 'text-sage' : 'text-ink/45'">
      <span class="text-xl font-normal leading-none">{{ item.icon }}</span><span>{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>
<script setup lang="ts">
const items = [{ to: '/', label: 'Главная', icon: '⌂' }, { to: '/create', label: 'Создать', icon: '+' }, { to: '/orders', label: 'Заказы', icon: '☰' }]
</script>
