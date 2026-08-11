<template>
  <div class="mb-7">
    <div class="mb-6 flex items-center justify-between text-xs font-semibold text-ink/45"><span>Шаг {{ step }} из 7</span><span>{{ Math.round((step / 7) * 100) }}%</span></div>
    <div class="h-1 overflow-hidden rounded-full bg-[#E9EDF3]"><div class="h-full rounded-full bg-sage transition-all duration-300" :style="{ width: `${(step / 7) * 100}%` }" /></div>
    <p class="mt-7 text-xs font-bold uppercase tracking-[.16em] text-sage">{{ eyebrow }}</p>
    <h1 class="mt-2 text-[30px] font-extrabold leading-[1.08] tracking-[-.04em]">{{ title }}</h1>
    <p v-if="description" class="mt-3 text-[15px] leading-6 text-ink/55">{{ description }}</p>
  </div>
</template>
<script setup lang="ts">
defineProps<{ step: number; eyebrow: string; title: string; description?: string }>()
</script>
