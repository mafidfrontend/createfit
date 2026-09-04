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
      <p class="mt-2 text-xs leading-5 text-ink/55">Загрузите 2 фото (спереди и сбоку) в полный рост. AI оценит ваши параметры и подберёт размер. Результат приблизительный — при необходимости уточните мерки вручную.</p>

      <!-- 2 ta rasm yuklash oynasi -->
      <div class="mt-4 grid grid-cols-2 gap-3">
        <!-- 1. Foto sredi (Old tomon) -->
        <div>
          <label v-if="!frontPhotoPreview" class="block h-full cursor-pointer rounded-2xl border border-dashed border-sage bg-mint p-4 text-center transition hover:bg-sage/10">
            <span class="block text-sm font-bold text-sage">Спереди</span>
            <span class="mt-1 block text-[10px] text-ink/50">В полный рост</span>
            <input class="hidden" type="file" accept="image/jpeg,image/png,image/webp" @change="(e) => handlePhoto(e, 'front')">
          </label>
          <div v-else class="relative overflow-hidden rounded-2xl border border-line bg-white">
            <img :src="frontPhotoPreview" alt="Спереди" class="h-32 w-full object-cover" />
            <button class="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-[10px] font-bold text-white backdrop-blur" @click="removePhoto('front')">✕</button>
          </div>
        </div>

        <!-- 2. Foto sboku (Yon tomon) -->
        <div>
          <label v-if="!sidePhotoPreview" class="block h-full cursor-pointer rounded-2xl border border-dashed border-sage bg-mint p-4 text-center transition hover:bg-sage/10">
            <span class="block text-sm font-bold text-sage">Сбоку</span>
            <span class="mt-1 block text-[10px] text-ink/50">Профиль</span>
            <input class="hidden" type="file" accept="image/jpeg,image/png,image/webp" @change="(e) => handlePhoto(e, 'side')">
          </label>
          <div v-else class="relative overflow-hidden rounded-2xl border border-line bg-white">
            <img :src="sidePhotoPreview" alt="Сбоку" class="h-32 w-full object-cover" />
            <button class="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-[10px] font-bold text-white backdrop-blur" @click="removePhoto('side')">✕</button>
          </div>
        </div>
      </div>

      <!-- Ikkala rasm yuklanmaguncha tugma ishlamaydi -->
      <button v-if="(frontPhotoPreview || sidePhotoPreview) && !analysisResult" class="mt-4 w-full rounded-xl bg-sage px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#0a4ad4] disabled:cursor-not-allowed disabled:opacity-50" :disabled="!frontPhotoPreview || !sidePhotoPreview || analyzing" @click="analyzePhoto">
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

useSeoMeta({ robots: 'noindex, nofollow' })
const order = useOrderStore()
const error = ref('')
const showPhotoUpload = ref(false)

// 2 ta rasm uchun State'lar
const frontPhotoPreview = ref('')
const frontPhotoBase64 = ref('')
const frontPhotoMime = ref('')

const sidePhotoPreview = ref('')
const sidePhotoBase64 = ref('')
const sidePhotoMime = ref('')

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

function handlePhoto(event: Event, type: 'front' | 'side'): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) { 
    analysisError.value = 'Файл слишком большой. Максимум — 5 МБ.'
    return 
  }
  
  analysisError.value = ''
  analysisResult.value = null
  
  const reader = new FileReader()
  reader.onload = () => {
    if (type === 'front') {
      frontPhotoPreview.value = reader.result as string
      frontPhotoBase64.value = reader.result as string
      frontPhotoMime.value = file.type
    } else {
      sidePhotoPreview.value = reader.result as string
      sidePhotoBase64.value = reader.result as string
      sidePhotoMime.value = file.type
    }
  }
  reader.readAsDataURL(file)
}

function removePhoto(type: 'front' | 'side'): void {
  if (type === 'front') {
    frontPhotoPreview.value = ''
    frontPhotoBase64.value = ''
    frontPhotoMime.value = ''
  } else {
    sidePhotoPreview.value = ''
    sidePhotoBase64.value = ''
    sidePhotoMime.value = ''
  }
  analysisResult.value = null
  analysisError.value = ''
}

async function analyzePhoto(): Promise<void> {
  if (!frontPhotoBase64.value || !sidePhotoBase64.value) {
    analysisError.value = 'Пожалуйста, загрузите оба фото (спереди и сбоку)'
    return
  }
  
  analyzing.value = true
  analysisError.value = ''
  
  try {
    // Rasmlarni to'g'ridan-to'g'ri AI tahliliga yuboramiz (Bazada saqlanmaydi - 100% maxfiylik!)
    const response = await $fetch<{ success: boolean, dimensions: any }>('/api/measurements/analyze', {
      method: 'POST',
      body: { 
        frontImageBase64: frontPhotoBase64.value,
        frontImageMime: frontPhotoMime.value,
        sideImageBase64: sidePhotoBase64.value,
        sideImageMime: sidePhotoMime.value,
        productType: order.draft.product?.name || 'одежда' 
      }
    })
    
    if (response.success && response.dimensions) {
      const dim = response.dimensions
      analysisResult.value = {
        recommendedSize: 'Индивидуальный (AI)',
        confidence: dim.confidence_score ? Math.round(dim.confidence_score * 100) : 92,
        measurements: {
          height: dim.length_cm,     // Длина
          chest: dim.chest_cm,       // Грудь
          waist: dim.waist_cm,       // Талия (Qo'shildi)
          hips: dim.hips_cm,         // Бёдра (Qo'shildi)
          shoulder: dim.shoulder_cm, // Плечо
          sleeve: dim.sleeve_cm      // Рукав
        },
        notes: 'AI успешно рассчитал примерные мерки по фото. Вы можете применить их и отредактировать вручную.'
      } as any
    }
  } catch (err: any) {
    analysisError.value = err.message || 'Не удалось проанализировать фото. Попробуйте другое изображение.'
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