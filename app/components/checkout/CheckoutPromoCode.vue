<script setup lang="ts">
import { ref, computed } from 'vue'
import AppButton from '~/components/AppButton.vue'

const props = defineProps<{
  modelValue: string
  appliedPromo: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  apply: []
  remove: []
}>()

const showInput = ref(false)

const hasApplied = computed(() => props.appliedPromo !== null)

function toggleInput() {
  showInput.value = !showInput.value
  if (!showInput.value && !hasApplied.value) {
    emit('update:modelValue', '')
  }
}

function apply() {
  if (props.modelValue.trim().length > 0) {
    emit('apply')
    showInput.value = false
  }
}

function remove() {
  emit('remove')
  emit('update:modelValue', '')
}
</script>

<template>
  <div>
    <div v-if="hasApplied" class="flex items-center justify-between rounded-2xl border-2 border-success-500 bg-success-50 px-4 py-3">
      <div class="flex items-center gap-2">
        <svg class="h-5 w-5 text-success-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        <div class="flex flex-col">
          <span class="text-sm font-bold text-success-600">{{ appliedPromo }}</span>
          <span class="text-xs text-success-500">Промокод применён</span>
        </div>
      </div>
      <button
        class="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition-colors active:bg-neutral-100 active:text-neutral-600"
        aria-label="Удалить промокод"
        @click="remove"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div v-else-if="showInput" class="space-y-2">
      <div class="flex gap-2">
        <input
          :value="modelValue"
          placeholder="Введите промокод"
          class="flex-1 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[15px] uppercase text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
        <AppButton variant="primary" size="md" @click="apply">
          Применить
        </AppButton>
      </div>
      <button class="text-xs text-neutral-400 active:text-neutral-600" @click="toggleInput">
        Отмена
      </button>
    </div>

    <button
      v-else
      class="flex w-full items-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 py-3 text-sm font-semibold text-neutral-500 transition-colors active:bg-neutral-50"
      @click="toggleInput"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20 12l-8 8H4v-8l8-8 8 8zM12 8v8M8 12h8" />
      </svg>
      У меня есть промокод
    </button>
  </div>
</template>
