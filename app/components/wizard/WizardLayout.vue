<template>
  <div class="min-h-screen bg-white flex flex-col">
    <!-- Progress Bar -->
    <div class="sticky top-0 z-10 bg-white border-b border-gray-100">
      <div class="px-4 py-3">
        <div class="flex items-center justify-between mb-2">
          <button
            v-if="currentStep > 1"
            @click="handleBack"
            class="flex items-center text-gray-600 active:text-gray-900"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span class="ml-1 text-sm font-medium">Назад</span>
          </button>
          <div v-else></div>

          <div class="text-sm font-medium text-gray-500">
            {{ currentStep }} / {{ totalSteps }}
          </div>
        </div>

        <div class="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-black transition-all duration-300"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-4 py-6">
      <slot />
    </div>

    <!-- Manufacturing Time -->
    <div class="px-4 py-3 bg-gray-50 border-t border-gray-100">
      <p class="text-sm text-gray-600 text-center">
        Срок изготовления: <span class="font-medium text-gray-900">7 дней</span>
      </p>
    </div>

    <!-- Next Button -->
    <div class="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4">
      <button
        @click="handleNext"
        :disabled="!canProceed"
        :class="[
          'w-full py-4 px-6 rounded-xl font-medium text-base transition-all active:scale-[0.98]',
          canProceed
            ? 'bg-black text-white'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        ]"
      >
        {{ nextButtonText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  currentStep: number
  totalSteps: number
  canProceed: boolean
  nextButtonText?: string
}>()

const emit = defineEmits<{
  next: []
  back: []
}>()

const handleNext = () => {
  if (props.canProceed) {
    emit('next')
  }
}

const handleBack = () => {
  emit('back')
}
</script>
