<script setup lang="ts">
defineProps<{
  number: number | string
  title: string
  description?: string
  optional?: boolean
}>()
</script>

<template>
  <div class="mb-5">
    <div class="flex items-baseline gap-2">
      <span class="text-lg font-extrabold text-primary-600">{{ number }}.</span>
      <h2 class="text-lg font-bold text-neutral-900">{{ title }}</h2>
      <span v-if="optional" class="text-sm text-neutral-400">(необязательно)</span>
    </div>
    <p v-if="description" class="mt-1 text-sm leading-relaxed text-neutral-500">
      {{ description }}
    </p>
  </div>
</template>
