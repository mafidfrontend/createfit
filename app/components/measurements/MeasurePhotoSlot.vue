<script setup lang="ts">
import { ref } from 'vue'
import type { PhotoValidationState } from '~/types'

const props = withDefaults(
  defineProps<{
    label: string
    guideImage?: string
    uploadedImage: string | null
    state: PhotoValidationState
    showGuide?: boolean
    compact?: boolean
  }>(),
  {
    guideImage: '',
    showGuide: true,
    compact: false,
  },
)

const emit = defineEmits<{
  upload: [dataUrl: string]
  retake: []
}>()

const inputRef = ref<HTMLInputElement | null>(null)

const errorMessages: Record<string, { title: string; hint: string }> = {
  error_blurry: {
    title: 'Фото размыто',
    hint: 'Снимите при хорошем освещении и держите камеру неподвижно.',
  },
  error_no_a4: {
    title: 'Лист А4 не обнаружен',
    hint: 'Держите лист А4 перед собой во время съёмки.',
  },
  error_body: {
    title: 'Тело не полностью в кадре',
    hint: 'Отойдите дальше от камеры, чтобы всё тело попало в кадр.',
  },
}

const currentError = computed(() => {
  if (props.state.startsWith('error_')) {
    return errorMessages[props.state] ?? null
  }
  return null
})

function triggerUpload() {
  inputRef.value?.click()
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    emit('upload', reader.result as string)
  }
  reader.readAsDataURL(file)
  target.value = ''
}
</script>

<template>
  <div class="flex flex-col">
    <input
      ref="inputRef"
      type="file"
      accept="image/png,image/jpeg"
      class="hidden"
      @change="onFileChange"
    />

    <span class="mb-2 text-sm font-bold text-neutral-900">{{ label }}</span>

    <div class="relative overflow-hidden rounded-2xl border-2" :class="compact ? 'aspect-[4/5]' : 'aspect-[3/4]'">
      <Transition
        mode="out-in"
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
      >
        <div v-if="uploadedImage" :key="'uploaded'" class="relative h-full w-full">
          <img :src="uploadedImage" :alt="label" class="h-full w-full object-cover" />

          <div
            v-if="state === 'validating'"
            class="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <svg class="h-7 w-7 animate-spin text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span class="mt-2 text-xs font-medium text-white">Анализируем фото...</span>
          </div>

          <div
            v-else-if="state === 'success'"
            class="absolute bottom-2 left-2 right-2 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 backdrop-blur-sm"
          >
            <svg class="h-5 w-5 shrink-0 text-success-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span class="text-xs font-semibold text-success-600">Фото принято</span>
          </div>
        </div>

        <div v-else :key="'guide'" class="relative h-full w-full bg-neutral-50">
          <img v-if="showGuide && guideImage" :src="guideImage" :alt="`${label} пример`" class="h-full w-full object-cover" />
          <div v-else class="flex h-full w-full items-center justify-center bg-neutral-100">
            <svg class="h-10 w-10 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <span
            v-if="showGuide && guideImage"
            class="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm"
          >
            Пример
          </span>
        </div>
      </Transition>
    </div>

    <div class="mt-2">
      <button
        v-if="state === 'idle'"
        class="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-700 transition-colors active:bg-neutral-100"
        @click="triggerUpload"
      >
        <svg class="h-4 w-4 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 16V4M5 11l7-7 7 7M5 20h14" />
        </svg>
        Загрузить фото
      </button>

      <div v-else-if="state === 'validating'" class="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-100 py-2.5 text-sm text-neutral-400">
        <span>Анализируем...</span>
      </div>

      <div v-else-if="state === 'success'" class="flex w-full items-center justify-center gap-2 rounded-xl bg-success-50 py-2.5 text-sm font-semibold text-success-600">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        Фото принято
      </div>

      <div v-else-if="currentError" class="rounded-xl bg-error-50 px-3 py-2.5">
        <div class="flex items-start gap-2">
          <svg class="mt-0.5 h-4 w-4 shrink-0 text-error-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <div class="flex-1">
            <p class="text-xs font-bold text-error-600">{{ currentError.title }}</p>
            <p class="mt-0.5 text-xs text-error-500">{{ currentError.hint }}</p>
          </div>
        </div>
        <button
          class="mt-2 w-full rounded-lg bg-error-500 py-2 text-xs font-semibold text-white transition-colors active:bg-error-600"
          @click="emit('retake')"
        >
          Переснять фото
        </button>
      </div>
    </div>
  </div>
</template>
