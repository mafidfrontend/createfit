<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    label?: string
    accept?: string
    maxSize?: number
    hint?: string
  }>(),
  {
    modelValue: null,
    label: '',
    accept: 'image/png,image/jpeg',
    maxSize: 10,
    hint: 'PNG, JPG до 10MB',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  change: [file: File | null]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)

function handleFile(file: File | undefined) {
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    emit('update:modelValue', reader.result as string)
    emit('change', file)
  }
  reader.readAsDataURL(file)
}

function onInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  handleFile(file)
}

function onDrop(event: DragEvent) {
  dragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  handleFile(file)
}

function removeImage() {
  emit('update:modelValue', null)
  emit('change', null)
  if (inputRef.value) {
    inputRef.value.value = ''
  }
}

function triggerInput() {
  inputRef.value?.click()
}
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="mb-2 block text-sm font-medium text-neutral-700">{{ label }}</label>

    <div v-if="modelValue" class="relative overflow-hidden rounded-2xl border border-neutral-200">
      <img :src="modelValue" alt="Загруженное изображение" class="h-48 w-full object-cover" />
      <button
        class="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform active:scale-95"
        aria-label="Удалить изображение"
        @click="removeImage"
      >
        <svg class="h-5 w-5 text-neutral-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div
      v-else
      class="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-10 transition-colors duration-200"
      :class="dragOver ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 bg-neutral-50'"
      role="button"
      tabindex="0"
      aria-label="Загрузить изображение"
      @click="triggerInput"
      @keydown.enter="triggerInput"
      @keydown.space.prevent="triggerInput"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
    >
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
        <svg class="h-6 w-6 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 16V4M5 11l7-7 7 7M5 20h14" />
        </svg>
      </div>
      <span class="mt-3 text-sm font-medium text-neutral-700">Нажмите, чтобы загрузить фото</span>
      <span class="mt-1 text-xs text-neutral-400">{{ hint }}</span>
    </div>

    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      class="hidden"
      @change="onInputChange"
    />
  </div>
</template>
