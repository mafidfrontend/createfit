<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    maxLength?: number
    label?: string
    error?: string
    rows?: number
  }>(),
  {
    placeholder: '',
    maxLength: 1000,
    label: '',
    error: '',
    rows: 4,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const charCount = computed(() => props.modelValue.length)

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="`textarea-${label}`" class="mb-2 block text-sm font-medium text-neutral-700">
      {{ label }}
    </label>
    <div
      class="relative rounded-2xl border transition-colors duration-200"
      :class="error ? 'border-error-500' : 'border-neutral-200 focus-within:border-primary-500'"
    >
      <textarea
        :id="`textarea-${label}`"
        :value="modelValue"
        :placeholder="placeholder"
        :maxlength="maxLength"
        :rows="rows"
        class="w-full resize-none rounded-2xl bg-white px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        @input="handleInput"
      />
      <span class="absolute bottom-3 right-4 text-xs text-neutral-400">
        {{ charCount }}/{{ maxLength }}
      </span>
    </div>
    <p v-if="error" class="mt-1.5 text-xs text-error-500">{{ error }}</p>
  </div>
</template>
