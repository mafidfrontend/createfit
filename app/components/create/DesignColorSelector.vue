<script setup lang="ts">
import { SHIRT_COLORS, type ShirtColor } from '~/types/design'
import AppSectionHeader from '~/components/AppSectionHeader.vue'

defineProps<{
  modelValue: ShirtColor
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ShirtColor]
}>()

function select(color: ShirtColor) {
  emit('update:modelValue', color)
}
</script>

<template>
  <section>
    <AppSectionHeader
      :number="4"
      title="Цвет изделия"
      description="Макет будет показан на выбранном цвете"
    />

    <div class="flex flex-wrap gap-3">
      <button
        v-for="color in SHIRT_COLORS"
        :key="color.id"
        class="flex items-center gap-2.5 rounded-2xl border-2 px-4 py-3 transition-all duration-200 tap-scale"
        :class="
          modelValue === color.id
            ? 'border-primary-600 bg-primary-50'
            : 'border-neutral-200 bg-white active:border-neutral-300'
        "
        :aria-pressed="modelValue === color.id"
        @click="select(color.id)"
      >
        <span
          class="h-6 w-6 shrink-0 rounded-full border border-neutral-200"
          :style="{ backgroundColor: color.hex }"
        />
        <span class="text-sm font-semibold text-neutral-900">{{ color.label }}</span>
      </button>
    </div>
  </section>
</template>
