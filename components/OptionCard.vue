<template>
  <button class="w-full rounded-xl border bg-white p-4 text-left transition" :class="selected ? 'border-sage ring-1 ring-sage' : 'border-line hover:border-ink/35'" @click="$emit('select')">
    <div class="flex items-start justify-between gap-3"><div><h3 class="text-[15px] font-bold">{{ title }}</h3><p v-if="description" class="mt-1 text-sm leading-5 text-ink/50">{{ description }}</p></div><span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border" :class="selected ? 'border-sage bg-sage text-white' : 'border-line'"><span v-if="selected" class="h-2 w-2 rounded-full bg-white" /></span></div>
    <div v-if="price !== undefined" class="mt-3 text-sm font-bold" :class="price === 0 ? 'text-ink/45' : 'text-sage'">{{ price === 0 ? 'Включено' : `+${formatUsd(price)}` }}</div>
  </button>
</template>
<script setup lang="ts">import { formatUsd } from '~/utils/pricing'; defineProps<{ title: string; description?: string; price?: number; selected?: boolean }>(); defineEmits<{ select: [] }>()</script>
