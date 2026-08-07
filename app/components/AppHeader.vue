<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    showBack?: boolean
    showMenu?: boolean
    transparent?: boolean
  }>(),
  {
    title: '',
    showBack: false,
    showMenu: false,
    transparent: false,
  },
)

const emit = defineEmits<{
  back: []
  menu: []
}>()

const headerClasses = computed(() => [
  'sticky top-0 z-40 flex h-16 items-center justify-between px-5 transition-colors duration-300',
  props.transparent ? 'bg-transparent' : 'bg-white/90 backdrop-blur-md border-b border-neutral-100',
])
</script>

<template>
  <header :class="headerClasses" role="banner">
    <div class="flex items-center gap-3">
      <button
        v-if="showBack"
        class="flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 active:bg-neutral-100 transition-colors"
        aria-label="Назад"
        @click="emit('back')"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      <h1 v-if="title" class="text-lg font-bold text-neutral-900">
        {{ title }}
      </h1>

      <span v-else class="text-xl font-extrabold tracking-tight text-neutral-900">
        CreateFit
      </span>
    </div>

    <button
      v-if="showMenu"
      class="flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 active:bg-neutral-100 transition-colors"
      aria-label="Меню"
      @click="emit('menu')"
    >
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  </header>
</template>
