<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string | number
    label?: string
    placeholder?: string
    type?: 'text' | 'number' | 'tel' | 'email'
    error?: string
    inputMode?: 'text' | 'numeric' | 'tel' | 'email'
  }>(),
  {
    label: '',
    placeholder: '',
    type: 'text',
    error: '',
    inputMode: 'text',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="mb-1.5 block text-sm font-medium text-neutral-700">{{ label }}</label>
    <div
      class="rounded-2xl border transition-colors duration-200"
      :class="error ? 'border-error-500' : 'border-neutral-200 focus-within:border-primary-500'"
    >
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :inputmode="inputMode"
        class="w-full rounded-2xl bg-white px-4 py-3.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        @input="handleInput"
      />
    </div>
    <p v-if="error" class="mt-1.5 text-xs text-error-500">{{ error }}</p>
  </div>
</template>
