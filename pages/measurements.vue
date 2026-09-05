<template>
  <div class="slide-up pb-8">
    <StepHeader :step="4" eyebrow="Размер" title="Твоя посадка" description="Выбери стандартный размер или загрузи фото для AI-расчёта мерок." />

    <!-- Standard sizes -->
    <div class="grid grid-cols-4 gap-2">
      <button v-for="size in STANDARD_SIZES" :key="size" class="rounded-xl border bg-white py-3 text-sm font-bold transition" :class="order.draft.size?.standardSize === size ? 'border-sage bg-mint text-sage' : 'border-line'" @click="selectStandard(size)">{{ size }}</button>
    </div>

    <!-- AI photo analysis & Manual entry combined section -->
    <div class="mt-4 rounded-2xl border border-line bg-white p-4">
      <div class="flex items-center justify-between">
        <p class="text-sm font-bold">AI-анализ мерок по фото</p>
        <button class="text-xs font-bold text-sage underline" @click="showPhotoUpload = !showPhotoUpload">
          {{ showPhotoUpload ? 'Скрыть фото' : 'Загрузить фото' }}
        </button>
      </div>
      
      <!-- 2 ta rasm yuklash oynasi -->
      <div v-if="showPhotoUpload" class="mt-4">
        
        <!-- YANNGI: Yo'riqnoma va A4 qog'oz haqida eslatma -->
        <div class="mb-4 rounded-xl bg-sage/5 p-3">
          <p class="text-xs font-bold text-sage">Как сделать правильное фото?</p>
          <ul class="mt-2 space-y-1 text-xs text-ink/70">
            <li>1. Встаньте прямо, камера на уровне груди.</li>
            <li>2. Одежда должна быть облегающей.</li>
            <li>3. <b>Важно:</b> Держите в руках обычный лист А4 — он нужен AI для точного масштаба.</li>
          </ul>
        </div>
        
        <div class="mt-3 grid grid-cols-2 gap-3">
          <!-- 1. Foto sredi -->
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

          <!-- 2. Foto sboku -->
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

        <!-- YANNGI: Foydalanuvchining bo'yini so'rash -->
        <div class="mt-4">
          <label class="text-xs font-bold text-ink">Ваш рост (в см) *</label>
          <input v-model="userHeightInput" type="number" placeholder="Например: 175" class="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-3 text-sm outline-none focus:border-sage" />
        </div>

        <button class="mt-4 w-full rounded-xl bg-sage px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0a4ad4] disabled:cursor-not-allowed disabled:opacity-50" :disabled="!frontPhotoPreview || !sidePhotoPreview || !userHeightInput || analyzing" @click="analyzePhoto">
          <span v-if="analyzing" class="flex items-center justify-center gap-2">
            <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            AI анализирует мерки...
          </span>
          <span v-else>Рассчитать по фото</span>
        </button>

        <p v-if="analysisError" class="mt-2 text-xs text-terracotta">{{ analysisError }}</p>
        
        <!-- YANNGI: Standart razmerni yirik qilib ko'rsatish -->
        <div v-if="aiPredictedSize" class="mt-3 rounded-xl bg-sage px-4 py-3 text-center text-white">
          <p class="text-xs opacity-80">Рекомендуемый размер</p>
          <p class="text-xl font-bold">{{ aiPredictedSize }}</p>
        </div>
      </div>
    </div>

    <!-- Manual / AI-populated measurements inputs -->
    <div class="mt-4 rounded-2xl border border-line bg-white p-4">
      <div class="mb-4 flex items-center justify-between">
        <p class="text-sm font-bold">Мерки в сантиметрах</p>
        <span v-if="isAiFilled" class="rounded-full bg-mint px-2.5 py-0.5 text-[10px] font-bold text-sage">AI рассчитал ✨</span>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <label v-for="field in measurementFields" :key="field.key" class="text-xs font-semibold text-ink/55">
          {{ field.label }}
          <input v-model="measurements[field.key]" class="mt-1.5 w-full rounded-xl border border-line bg-cream px-3 py-3 text-sm text-ink outline-none focus:border-sage" type="text" inputmode="decimal" @input="onManualInput" />
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

useSeoMeta({ robots: 'noindex, nofollow' })
const order = useOrderStore()
const error = ref('')
const showPhotoUpload = ref(false)

const frontPhotoPreview = ref('')
const frontPhotoBase64 = ref('')
const frontPhotoMime = ref('')

const sidePhotoPreview = ref('')
const sidePhotoBase64 = ref('')
const sidePhotoMime = ref('')

const userHeightInput = ref('') // YANNGI
const aiPredictedSize = ref('') // YANNGI

const analyzing = ref(false)
const analysisError = ref('')
const isAiFilled = ref(false)

const measurementFields: { key: keyof CustomMeasurements; label: string }[] = [
  { key: 'height', label: 'Рост / Длина' },
  { key: 'chest', label: 'Грудь' },
  { key: 'waist', label: 'Талия' },
  { key: 'hips', label: 'Бёдра' },
  { key: 'length', label: 'Длина изделия' },
  { key: 'sleeve', label: 'Длина рукава' }
]
const measurements = reactive<CustomMeasurements>({ height: '', chest: '', waist: '', hips: '', length: '', sleeve: '', other: '' })

function selectStandard(size: string): void {
  isAiFilled.value = false
  aiPredictedSize.value = ''
  order.setSize({ type: 'standard', standardSize: size, customMeasurements: null })
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
  aiPredictedSize.value = ''
  
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
  analysisError.value = ''
}

async function analyzePhoto(): Promise<void> {
  if (!frontPhotoBase64.value || !sidePhotoBase64.value || !userHeightInput.value) {
    analysisError.value = 'Загрузите оба фото и укажите свой рост.'
    return
  }
  
  analyzing.value = true
  analysisError.value = ''
  aiPredictedSize.value = ''
  
  try {
    const response = await $fetch<{ success: boolean, dimensions: any }>('/api/measurements/analyze', {
      method: 'POST',
      body: { 
        frontImageBase64: frontPhotoBase64.value,
        frontImageMime: frontPhotoMime.value,
        sideImageBase64: sidePhotoBase64.value,
        sideImageMime: sidePhotoMime.value,
        productType: order.draft.product?.name || 'одежда',
        userHeight: userHeightInput.value // YANNGI: Bo'yni API ga yuboramiz
      }
    })
    
    if (response.success && response.dimensions) {
      const dim = response.dimensions
      
      measurements.height = String(userHeightInput.value)
      measurements.chest = dim.chest_cm ? String(dim.chest_cm) : ''
      measurements.waist = dim.waist_cm ? String(dim.waist_cm) : ''
      measurements.hips = dim.hips_cm ? String(dim.hips_cm) : ''
      measurements.sleeve = dim.sleeve_cm ? String(dim.sleeve_cm) : ''
      measurements.length = dim.length_cm ? String(dim.length_cm) : ''
      
      isAiFilled.value = true
      aiPredictedSize.value = dim.predicted_size || 'M'

      order.setSize({
        type: 'standard',
        standardSize: aiPredictedSize.value,
        customMeasurements: { ...measurements },
        aiEstimated: true,
        aiConfidence: dim.confidence_score ? Math.round(dim.confidence_score * 100) : 92
      })
    }
  } catch (err: any) {
    analysisError.value = err.message || 'Не удалось проанализировать фото. Попробуйте еще раз.'
  } finally {
    analyzing.value = false
  }
}

function onManualInput(): void {
  isAiFilled.value = false
  order.setSize({
    type: 'custom',
    standardSize: aiPredictedSize.value || null,
    customMeasurements: { ...measurements }
  })
}

function goNext(): void {
  if (!order.hasSize) {
    error.value = 'Выберите размер или заполните мерки'
    return
  }
  navigateTo('/cart')
}
</script>