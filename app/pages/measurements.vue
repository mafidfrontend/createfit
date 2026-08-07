<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '~/components/AppHeader.vue'
import AppButton from '~/components/AppButton.vue'
import AppInput from '~/components/AppInput.vue'
import MeasureStep1Guide from '~/components/measurements/MeasureStep1Guide.vue'

const router = useRouter()
const measurementsStore = useMeasurementsStore()

const step = computed(() => measurementsStore.step)
const isExtracting = computed(() => measurementsStore.isExtracting)

function goBack() {
  router.push('/')
}

function onUploadFront(dataUrl: string) {
  measurementsStore.uploadPhoto('front', dataUrl)
}

function onUploadSide(dataUrl: string) {
  measurementsStore.uploadPhoto('side', dataUrl)
}

function onRetakeFront() {
  measurementsStore.clearPhoto('front')
}

function onRetakeSide() {
  measurementsStore.clearPhoto('side')
}

function continueFromStep1() {
  measurementsStore.nextStep()
}

function continueFromStep2() {
  measurementsStore.extractMeasurements()
}

function adjustMeasurement(key: keyof typeof measurementsStore.data, delta: number) {
  const current = measurementsStore.data[key]
  if (current === null) return
  measurementsStore.updateMeasurement(key, Math.max(0, current + delta))
}

function confirmAndCheckout() {
  measurementsStore.confirm()
  router.push('/cart')
}

function startOver() {
  measurementsStore.reset()
}

const measurementFields: { key: 'chest' | 'waist' | 'hip' | 'shoulder' | 'sleeve' | 'height'; label: string }[] = [
  { key: 'chest', label: 'Обхват груди' },
  { key: 'waist', label: 'Обхват талии' },
  { key: 'hip', label: 'Обхват бёдер' },
  { key: 'shoulder', label: 'Ширина плеч' },
  { key: 'sleeve', label: 'Длина рукава' },
  { key: 'height', label: 'Рост' },
]
</script>

<template>
  <div class="flex flex-1 flex-col">
    <AppHeader title="Снять мерки" show-back show-menu @back="goBack" />

    <main class="flex-1 overflow-y-auto px-5 pt-4 pb-28">
      <!-- Step indicator -->
      <div class="mb-6 flex items-center gap-2">
        <div
          v-for="s in 4"
          :key="s"
          class="h-1.5 flex-1 rounded-full transition-colors duration-300"
          :class="step >= s ? 'bg-primary-600' : 'bg-neutral-200'"
        />
      </div>

      <!-- Step 1: Photos -->
      <div v-if="step === 1">
        <MeasureStep1Guide
          :front-photo="measurementsStore.frontPhoto"
          :side-photo="measurementsStore.sidePhoto"
          :can-continue="measurementsStore.bothPhotosValidated"
          @upload-front="onUploadFront"
          @upload-side="onUploadSide"
          @retake-front="onRetakeFront"
          @retake-side="onRetakeSide"
          @continue="continueFromStep1"
        />
      </div>

      <!-- Step 2: Personal info -->
      <div v-else-if="step === 2">
        <h2 class="text-lg font-bold text-neutral-900">Ваши данные</h2>
        <p class="mt-1 text-sm text-neutral-500">Для расчёта мерок по фото</p>

        <div class="mt-5 space-y-4">
          <AppInput
            :model-value="measurementsStore.personalInfo.name"
            label="Имя"
            placeholder="Иван"
            @update:model-value="measurementsStore.updatePersonalInfo('name', $event)"
          />
          <AppInput
            :model-value="measurementsStore.personalInfo.height"
            label="Рост (см)"
            placeholder="178"
            type="number"
            input-mode="numeric"
            @update:model-value="measurementsStore.updatePersonalInfo('height', $event)"
          />
          <AppInput
            :model-value="measurementsStore.personalInfo.age"
            label="Возраст"
            placeholder="25"
            type="number"
            input-mode="numeric"
            @update:model-value="measurementsStore.updatePersonalInfo('age', $event)"
          />
          <AppInput
            :model-value="measurementsStore.personalInfo.phoneModel"
            label="Модель телефона"
            placeholder="iPhone 15"
            @update:model-value="measurementsStore.updatePersonalInfo('phoneModel', $event)"
          />
        </div>

        <div class="mt-6 flex gap-3">
          <AppButton variant="outline" size="lg" class="flex-1" @click="measurementsStore.prevStep()">
            Назад
          </AppButton>
          <AppButton size="lg" class="flex-[1.5]" :disabled="!measurementsStore.personalInfoValid" @click="continueFromStep2">
            Снять мерки
          </AppButton>
        </div>
      </div>

      <!-- Step 3: Extracting -->
      <div v-else-if="step === 3" class="flex flex-col items-center justify-center py-20 text-center">
        <svg class="h-10 w-10 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <h2 class="mt-4 text-lg font-bold text-neutral-900">Анализируем фото...</h2>
        <p class="mt-1 text-sm text-neutral-500">AI снимает мерки с точностью до сантиметра</p>
      </div>

      <!-- Step 4: Results -->
      <div v-else>
        <div class="flex items-center gap-2">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-success-100">
            <svg class="h-5 w-5 text-success-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-bold text-neutral-900">Мерки готовы!</h2>
            <p class="text-xs text-neutral-500">Проверьте и отредактируйте при необходимости</p>
          </div>
        </div>

        <div class="mt-5 space-y-3">
          <div
            v-for="field in measurementFields"
            :key="field.key"
            class="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3"
          >
            <span class="text-sm font-medium text-neutral-700">{{ field.label }}</span>
            <div class="flex items-center gap-2">
              <button
                class="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors active:bg-neutral-100"
                aria-label="Уменьшить"
                @click="adjustMeasurement(field.key, -1)"
              >
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                  <path d="M5 12h14" />
                </svg>
              </button>
              <span class="min-w-[60px] text-center text-sm font-bold text-neutral-900">
                {{ measurementsStore.data[field.key] ?? '-' }} см
              </span>
              <button
                class="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors active:bg-neutral-100"
                aria-label="Увеличить"
                @click="adjustMeasurement(field.key, 1)"
              >
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="mt-6 flex flex-col gap-3">
          <AppButton size="lg" full-width @click="confirmAndCheckout">
            Подтвердить и перейти в корзину
          </AppButton>
          <AppButton variant="ghost" size="md" full-width @click="startOver">
            Начать заново
          </AppButton>
        </div>
      </div>
    </main>
  </div>
</template>
