<template>
  <div class="slide-up pb-8">
    <StepHeader :step="4" eyebrow="Размер" title="Твоя посадка" description="Выбери стандартный размер или загрузи фото для AI-расчёта мерок." />

    <!-- Standard sizes -->
    <div class="grid grid-cols-4 gap-2">
      <button v-for="size in STANDARD_SIZES" :key="size" class="rounded-xl border bg-white py-3 text-sm font-bold transition" :class="order.draft.size?.standardSize === size ? 'border-sage bg-mint text-sage' : 'border-line'" @click="selectStandard(size)">{{ size }}</button>
    </div>

    <!-- AI photo analysis -->
    <button class="mt-4 w-full rounded-2xl border bg-white p-4 text-left text-sm font-bold transition" :class="order.draft.size?.type === 'custom' ? 'border-sage bg-mint text-sage' : 'border-line'" @click="showPhotoUpload = !showPhotoUpload">
      Загрузить фото для AI-расчёта мерок
    </button>

    <div v-if="showPhotoUpload" class="mt-4 rounded-2xl border border-line bg-white p-4">
      <p class="text-sm font-bold">AI-анализ мерок по фото</p>
      <p class="mt-2 text-xs leading-5 text-ink/55">Загрузи своё фото в полный рост. AI оценит твои параметры и подберёт размер. Результат приблизительный — при необходимости уточни мерки вручную.</p>

      <label v-if="!photoPreview" class="mt-4 block cursor-pointer rounded-2xl border border-dashed border-sage bg-mint p-4">
        <span class="text-sm font-bold text-sage">Загрузить фото</span>
        <span class="mt-1 block text-xs text-ink/50">JPG, PNG, WEBP до 5 МБ</span>
        <input class="hidden" type="file" accept="image/jpeg,image/png,image/webp" @change="handlePhoto">
      </label>

      <div v-if="photoPreview" class="relative mt-3 overflow-hidden rounded-2xl bg-white">
        <img :src="photoPreview" alt="Ваше фото" class="max-h-56 w-full object-contain" />
        <button class="absolute right-2 top-2 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white" @click="removePhoto">Удалить</button>
      </div>

      <button v-if="photoPreview && !analysisResult" class="mt-4 w-full rounded-xl bg-sage px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#0a4ad4] disabled:cursor-not-allowed disabled:bg-[#E2E8F0]" :disabled="analyzing" @click="analyzePhoto">
        <span v-if="analyzing" class="flex items-center justify-center gap-2">
          <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          Анализ...
        </span>
        <span v-else>Рассчитать мерки</span>
      </button>

      <p v-if="analysisError" class="mt-3 text-sm text-terracotta">{{ analysisError }}</p>

      <!-- Analysis results -->
      <div v-if="analysisResult" class="mt-4 rounded-xl bg-mint p-4">
        <div class="flex items-center justify-between">
          <p class="text-sm font-bold text-sage">Рекомендуемый размер: {{ analysisResult.recommendedSize }}</p>
          <span class="rounded-full bg-white px-3 py-1 text-xs font-bold" :class="analysisResult.confidence >= 60 ? 'text-sage' : 'text-terracotta'">Уверенность: {{ analysisResult.confidence }}%</span>
        </div>
        <div v-if="analysisResult.measurements" class="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div v-if="analysisResult.measurements.height" class="rounded-lg bg-white px-2 py-2 text-center"><span class="block text-ink/45">Рост</span><b>{{ analysisResult.measurements.height }} см</b></div>
          <div v-if="analysisResult.measurements.chest" class="rounded-lg bg-white px-2 py-2 text-center"><span class="block text-ink/45">Грудь</span><b>{{ analysisResult.measurements.chest }} см</b></div>
          <div v-if="analysisResult.measurements.waist" class="rounded-lg bg-white px-2 py-2 text-center"><span class="block text-ink/45">Талия</span><b>{{ analysisResult.measurements.waist }} см</b></div>
          <div v-if="analysisResult.measurements.hips" class="rounded-lg bg-white px-2 py-2 text-center"><span class="block text-ink/45">Бёдра</span><b>{{ analysisResult.measurements.hips }} см</b></div>
          <div v-if="analysisResult.measurements.shoulder" class="rounded-lg bg-white px-2 py-2 text-center"><span class="block text-ink/45">Плечо</span><b>{{ analysisResult.measurements.shoulder }} см</b></div>
          <div v-if="analysisResult.measurements.sleeve" class="rounded-lg bg-white px-2 py-2 text-center"><span class="block text-ink/45">Рукав</span><b>{{ analysisResult.measurements.sleeve }} см</b></div>
        </div>
        <p v-if="analysisResult.notes" class="mt-3 text-xs leading-5 text-ink/55">{{ analysisResult.notes }}</p>
        <button v-if="analysisResult.confidence >= 30" class="mt-3 w-full rounded-xl bg-sage px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0a4ad4]" @click="applyAiSize">Применить размер {{ analysisResult.recommendedSize }}</button>
      </div>
    </div>

    <!-- Custom measurements -->
    <button class="mt-4 w-full rounded-2xl border bg-white p-4 text-left text-sm font-bold transition" :class="order.draft.size?.type === 'custom' && !order.draft.size?.aiEstimated ? 'border-sage bg-mint text-sage' : 'border-line'" @click="selectCustom">Ввести мерки вручную</button>

    <div v-if="order.draft.size?.type === 'custom' && !order.draft.size?.aiEstimated" class="mt-4 rounded-2xl border border-line bg-white p-4">
      <p class="mb-4 text-sm font-bold">Укажи мерки в сантиметрах</p>
      <div class="grid grid-cols-2 gap-3">
        <label v-for="field in measurementFields" :key="field.key" class="text-xs font-semibold text-ink/55">
          {{ field.label }}
          <input v-model="measurements[field.key]" class="mt-2 w-full rounded-xl border border-line bg-cream px-3 py-3 text-sm text-ink outline-none focus:border-sage" type="text" inputmode="decimal" />
        </label>
      </div>
    </div>

    <p class="mt-6 text-sm font-bold text-sage">Срок изготовления: 7 дней</p>
    <PriceSummary :product-price="order.draft.product?.basePrice ?? 0" :fabric-price="order.draft.fabric?.additionalPrice ?? 0" :delivery-price="order.draft.deliveryPrice" :total="order.draft.totalPrice" />
    <p v-if="error" class="mt-3 text-sm text-terracotta">{{ error }}</p>
    <BackNext back-to="/design" :disabled="!order.hasSize" @next="goNext" />
  </div>
</template>

<script setup lang="ts">
import { STANDARD_SIZES } from '~/config/catalog'
import type { CustomMeasurements } from '~/types/order'
import type { MeasurementResult } from '~/types/design'

const order = useOrderStore()
const error = ref('')
const showPhotoUpload = ref(false)
const photoPreview = ref('')
const photoBase64 = ref('')
const photoMime = ref('')
const analyzing = ref(false)
const analysisResult = ref<MeasurementResult | null>(null)
const analysisError = ref('')

const measurementFields: { key: keyof CustomMeasurements; label: string }[] = [
  { key: 'height', label: 'Рост' },
  { key: 'chest', label: 'Грудь' },
  { key: 'waist', label: 'Талия' },
  { key: 'hips', label: 'Бёдра' },
  { key: 'length', label: 'Длина изделия' },
  { key: 'sleeve', label: 'Длина рукава' }
]
const measurements = reactive<CustomMeasurements>({ height: '', chest: '', waist: '', hips: '', length: '', sleeve: '', other: '' })

function selectStandard(size: string): void {
  order.setSize({ type: 'standard', standardSize: size, customMeasurements: null })
}

function selectCustom(): void {
  order.setSize({ type: 'custom', standardSize: null, customMeasurements: { ...measurements } })
}

function handlePhoto(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) { analysisError.value = 'Файл слишком большой. Максимум — 5 МБ.'; return }
  analysisError.value = ''
  analysisResult.value = null
  const reader = new FileReader()
  reader.onload = () => {
    photoPreview.value = reader.result as string
    photoBase64.value = reader.result as string
    photoMime.value = file.type
  }
  reader.readAsDataURL(file)
}

function removePhoto(): void {
  photoPreview.value = ''
  photoBase64.value = ''
  photoMime.value = ''
  analysisResult.value = null
  analysisError.value = ''
}

async function analyzePhoto(): Promise<void> {
  if (!photoBase64.value) return
  analyzing.value = true
  analysisError.value = ''
  try {
    const result = await $fetch<MeasurementResult>('/api/measurements/analyze', {
      method: 'POST',
      body: { photo: photoBase64.value, mimeType: photoMime.value }
    })
    analysisResult.value = result
  } catch (err: unknown) {
    analysisError.value = err instanceof Error ? err.message : 'Не удалось проанализировать фото. Попробуйте другое изображение.'
  } finally {
    analyzing.value = false
  }
}

function applyAiSize(): void {
  if (!analysisResult.value) return
  const m = analysisResult.value.measurements
  const custom: CustomMeasurements = {
    height: m.height ? String(m.height) : '',
    chest: m.chest ? String(m.chest) : '',
    waist: m.waist ? String(m.waist) : '',
    hips: m.hips ? String(m.hips) : '',
    length: '',
    sleeve: m.sleeve ? String(m.sleeve) : '',
    other: analysisResult.value.notes
  }
  order.setSize({ type: 'standard', standardSize: analysisResult.value.recommendedSize, customMeasurements: custom, aiEstimated: true, aiConfidence: analysisResult.value.confidence })
}

watch(measurements, () => {
  if (order.draft.size?.type === 'custom' && !order.draft.size?.aiEstimated) {
    order.setSize({ type: 'custom', standardSize: null, customMeasurements: { ...measurements } })
  }
})

function goNext(): void {
  if (!order.hasSize) {
    error.value = 'Выберите размер или загрузите фото для AI-расчёта'
    return
  }
  navigateTo('/cart')
}
</script>
