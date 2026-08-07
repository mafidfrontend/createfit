<script setup lang="ts">
import { DESIGN_STYLES, type DesignStyle } from '~/types/design'
import AppSectionHeader from '~/components/AppSectionHeader.vue'

defineProps<{
  modelValue: DesignStyle
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DesignStyle]
}>()

function select(style: DesignStyle) {
  emit('update:modelValue', style)
}
</script>

<template>
  <section>
    <AppSectionHeader
      :number="3"
      title="Выберите стиль"
      description="Стиль определяет общую эстетику дизайна"
    />

    <div class="grid grid-cols-2 gap-3">
      <button
        v-for="style in DESIGN_STYLES"
        :key="style.id"
        class="flex flex-col rounded-2xl border-2 p-4 text-left transition-all duration-200 tap-scale"
        :class="
          modelValue === style.id
            ? 'border-primary-600 bg-primary-50'
            : 'border-neutral-200 bg-white active:border-neutral-300'
        "
        :aria-pressed="modelValue === style.id"
        @click="select(style.id)"
      >
        <span class="text-sm font-bold leading-tight text-neutral-900">{{ style.label }}</span>
        <span class="mt-1 text-[11px] leading-tight text-neutral-500">{{ style.description }}</span>
      </button>
    </div>
  </section>
</template>
