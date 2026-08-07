<script setup lang="ts">
type Side = 'front' | 'back'

const props = defineProps<{
  modelValue: Side
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Side]
}>()
</script>

<template>
  <div class="flex rounded-2xl bg-neutral-100 p-1" role="tablist" aria-label="Сторона дизайна">
    <button
      role="tab"
      :aria-selected="modelValue === 'front'"
      class="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200"
      :class="
        modelValue === 'front'
          ? 'bg-white text-neutral-900 shadow-sm'
          : 'text-neutral-500 active:text-neutral-700'
      "
      @click="emit('update:modelValue', 'front')"
    >
      Спереди
    </button>
    <button
      role="tab"
      :aria-selected="modelValue === 'back'"
      class="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200"
      :class="
        modelValue === 'back'
          ? 'bg-white text-neutral-900 shadow-sm'
          : 'text-neutral-500 active:text-neutral-700'
      "
      @click="emit('update:modelValue', 'back')"
    >
      Сзади
    </button>
  </div>
</template>
