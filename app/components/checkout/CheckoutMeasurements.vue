<script setup lang="ts">
import type { Measurements } from '~/types'

defineProps<{
  measurements: Measurements
}>()

const measurementLabels: { key: keyof Measurements; label: string }[] = [
  { key: 'chest', label: 'Обхват груди' },
  { key: 'waist', label: 'Обхват талии' },
  { key: 'hip', label: 'Обхват бёдер' },
  { key: 'shoulder', label: 'Ширина плеч' },
  { key: 'sleeve', label: 'Длина рукава' },
  { key: 'height', label: 'Рост' },
]
</script>

<template>
  <div class="rounded-2xl border border-neutral-200 bg-white p-4">
    <div class="mb-3 flex items-center gap-2">
      <svg class="h-4 w-4 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 17L17 3l4 4L7 21l-4-4zM7 9l2 2M11 5l2 2M9 11l2 2" />
      </svg>
      <span class="text-sm font-bold text-neutral-900">Подтверждённые мерки</span>
    </div>

    <div class="grid grid-cols-2 gap-x-4 gap-y-2">
      <div v-for="m in measurementLabels" :key="m.key" class="flex items-center justify-between">
        <span class="text-xs text-neutral-500">{{ m.label }}</span>
        <span class="text-sm font-semibold text-neutral-900">{{ measurements[m.key] }} см</span>
      </div>
    </div>
  </div>
</template>
