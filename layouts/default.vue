<template>
  <div class="cf-shell text-ink">
    <div class="cf-content">
      <header class="cf-header">
        <NuxtLink to="/" class="cf-logo">Fabrika</NuxtLink>
        <NuxtLink to="/orders" aria-label="Открыть заказы" class="cf-menu text-lg font-bold leading-none text-ink">≡<span v-if="hasSelection" class="absolute ml-1 mt-[-3px] inline-flex h-1.5 w-1.5 rounded-full bg-sage" /></NuxtLink>
      </header>
      <main class="px-6"><slot /></main>
      <BottomNav />
    </div>
  </div>
</template>
<script setup lang="ts">
const order = useOrderStore()
const hasSelection = computed(() => Boolean(order.draft.product))
</script>
