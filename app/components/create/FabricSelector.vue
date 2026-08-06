<script setup lang="ts">
import { FABRICS } from '~/config/products'
import type { Fabric } from '~/types'
import AppSectionHeader from '~/components/AppSectionHeader.vue'

const props = defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const fabricIconPaths: Record<string, string> = {
  cotton: 'M12 2C8 2 5 5 5 9c0 2 1 4 3 5-2 1-3 3-3 5 0 1 1 2 2 2h10c1 0 2-1 2-2 0-2-1-4-3-5 2-1 3-3 3-5 0-4-3-7-7-7z',
  polyester: 'M3 3l6 6 6-6 6 6M3 9l6 6 6-6 6 6M3 15l6 6 6-6 6 6',
  linen: 'M12 2v20M8 4v16M16 4v16M4 8h16M4 16h16',
  blend: 'M4 4l8 8M12 4l-8 8M20 4l-8 8M12 20l8-8M4 12l8 8',
}

function select(fabric: Fabric) {
  emit('update:modelValue', fabric.id)
}
</script>

<template>
  <section>
    <AppSectionHeader
      :number="3"
      title="Выберите ткань"
      description="От выбора ткани зависит комфорт и назначение футболки"
    />

    <div class="grid grid-cols-2 gap-3">
      <button
        v-for="fabric in FABRICS"
        :key="fabric.id"
        class="flex flex-col rounded-2xl border-2 p-4 text-left transition-all duration-200 tap-scale"
        :class="
          modelValue === fabric.id
            ? 'border-primary-600 bg-primary-50'
            : 'border-neutral-200 bg-white active:border-neutral-300'
        "
        :aria-pressed="modelValue === fabric.id"
        @click="select(fabric)"
      >
        <div class="flex items-center gap-2">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            :class="modelValue === fabric.id ? 'bg-primary-100' : 'bg-neutral-100'"
          >
            <svg
              class="h-5 w-5"
              :class="modelValue === fabric.id ? 'text-primary-600' : 'text-neutral-500'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path :d="fabricIconPaths[fabric.icon]" />
            </svg>
          </div>
          <span class="text-sm font-bold leading-tight text-neutral-900">{{ fabric.name }}</span>
        </div>

        <ul class="mt-3 flex flex-col gap-1">
          <li
            v-for="(feature, index) in fabric.features"
            :key="index"
            class="flex items-start gap-1.5 text-[11px] leading-tight text-neutral-500"
          >
            <span class="mt-0.5 text-primary-500">•</span>
            <span>{{ feature }}</span>
          </li>
        </ul>
      </button>
    </div>
  </section>
</template>
