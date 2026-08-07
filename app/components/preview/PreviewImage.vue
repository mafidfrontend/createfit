<script setup lang="ts">
import { computed } from 'vue'

type Side = 'front' | 'back'

const props = defineProps<{
  side: Side
  frontImage: string | null
  backImage: string | null
  isGenerating?: boolean
}>()

const MOCK_FRONT = 'https://images.pexels.com/photos/6311251/pexels-photo-6311251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
const MOCK_BACK = 'https://images.pexels.com/photos/6311141/pexels-photo-6311141.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'

const activeImage = computed(() => {
  if (props.side === 'front') {
    return props.frontImage ?? MOCK_FRONT
  }
  return props.backImage ?? MOCK_BACK
})

const sideLabel = computed(() => props.side === 'front' ? 'Спереди' : 'Сзади')
</script>

<template>
  <div class="relative">
    <Transition
      mode="out-in"
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 scale-[0.97]"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-[0.97]"
    >
      <div v-if="isGenerating" :key="'skeleton'" class="flex h-72 flex-col items-center justify-center rounded-3xl bg-neutral-100">
        <svg
          class="h-8 w-8 animate-spin text-primary-400"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span class="mt-3 text-sm font-medium text-neutral-400">Генерация дизайна...</span>
      </div>

      <div v-else :key="side" class="relative overflow-hidden rounded-3xl bg-neutral-50">
        <img
          :src="activeImage"
          :alt="`Дизайн ${sideLabel.toLowerCase()}`"
          class="h-72 w-full object-cover object-top"
          loading="eager"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
        <span class="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-neutral-600 backdrop-blur-sm">
          {{ sideLabel }}
        </span>
      </div>
    </Transition>
  </div>
</template>
