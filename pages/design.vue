<template>
  <div class="slide-up pb-8">
    <StepHeader :step="3" eyebrow="Ткань и дизайн" title="Собери характер" description="Выбери материал и создай свой дизайн." />

    <!-- Fabric selection -->
    <h2 class="mb-3 text-lg font-bold">Ткань</h2>
    <div class="space-y-3">
      <OptionCard v-for="fabric in FABRICS" :key="fabric.id" :title="fabric.name" :description="fabric.description" :price="fabric.additionalPrice" :selected="order.draft.fabric?.id === fabric.id" @select="order.setFabric(fabric)" />
    </div>

    <!-- Design mode tabs -->
    <h2 class="mb-3 mt-8 text-lg font-bold">Дизайн</h2>
    <div class="flex gap-2 rounded-xl bg-[#FAFBFD] p-1">
      <button v-for="tab in designTabs" :key="tab.id" class="flex-1 rounded-lg py-2.5 text-sm font-bold transition" :class="activeTab === tab.id ? 'bg-sage text-white' : 'text-ink/50'" @click="activeTab = tab.id">{{ tab.label }}</button>
    </div>

    <!-- Existing designs -->
    <div v-if="activeTab === 'existing'" class="mt-4 grid grid-cols-3 gap-3">
      <button v-for="design in EXISTING_DESIGNS" :key="design.id" class="rounded-2xl border bg-white p-3 text-left transition" :class="selectedExisting === design.id ? 'border-sage ring-2 ring-sage/10' : 'border-line'" @click="selectExisting(design)">
        <span class="mb-3 block aspect-square rounded-xl" :style="{ background: design.accent }"><span class="flex h-full items-center justify-center text-xs font-bold text-ink/50">CF</span></span>
        <span class="text-xs font-bold">{{ design.name }}</span>
      </button>
    </div>

    <!-- Upload design & Gemini Dimension Extraction -->
    <div v-else-if="activeTab === 'upload'">
      <label class="mt-4 block cursor-pointer rounded-2xl border border-dashed border-sage bg-mint p-4 transition" :class="{ 'opacity-60 pointer-events-none': uploadingLogo }">
        <span class="text-sm font-bold text-sage">{{ uploadingLogo ? 'Загрузка...' : 'Загрузить фото одежды' }}</span>
        <span class="mt-1 block text-xs text-ink/50">JPG, PNG, WEBP до 5 МБ</span>
        <input class="hidden" type="file" accept="image/jpeg,image/png,image/webp" :disabled="uploadingLogo" @change="handleLogoUpload">
      </label>
      
      <div v-if="logoPreview" class="relative mt-3 overflow-hidden rounded-2xl bg-white border border-line">
        <img :src="logoPreview" alt="Предпросмотр дизайна" class="max-h-48 w-full object-contain bg-cream" />
        <button class="absolute right-2 top-2 rounded-full bg-ink/70 px-3 py-1 text-xs font-bold text-white backdrop-blur transition hover:bg-terracotta" @click="removeLogo">Удалить</button>
      </div>

      <!-- YANNGI: Gemini AI Sizes Results -->
      <div v-if="extractingDimensions" class="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-line bg-white p-4 text-sm font-bold text-sage">
        <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        AI распознает размеры...
      </div>
      
      <div v-else-if="extractedDimensions" class="mt-4 rounded-2xl border border-sage bg-mint p-4">
        <p class="mb-3 text-sm font-bold text-sage">AI определил размеры изделия:</p>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between border-b border-sage/10 pb-1.5"><span class="text-ink/60">Ширина (Грудь):</span> <b class="text-right">{{ extractedDimensions.chest_cm }} см</b></div>
          <div class="flex justify-between border-b border-sage/10 pb-1.5"><span class="text-ink/60">Длина:</span> <b class="text-right">{{ extractedDimensions.length_cm }} см</b></div>
          <div class="flex justify-between border-b border-sage/10 pb-1.5"><span class="text-ink/60">Плечи:</span> <b class="text-right">{{ extractedDimensions.shoulder_cm }} см</b></div>
          <div class="flex justify-between pt-0.5"><span class="text-ink/60">Длина рукава:</span> <b class="text-right">{{ extractedDimensions.sleeve_cm }} см</b></div>
        </div>
      </div>
      <p v-if="extractError" class="mt-2 text-xs font-medium text-terracotta">{{ extractError }}</p>
    </div>

    <!-- AI design creation -->
    <div v-else class="mt-4 space-y-4">
      <!-- Logo upload for AI -->
      <div>
        <label class="text-sm font-bold">Логотип или графика <span class="font-normal text-ink/45">(необязательно)</span></label>
        <label class="mt-2 block cursor-pointer rounded-2xl border border-dashed border-line bg-white p-4 transition hover:border-sage" :class="{ 'opacity-60 pointer-events-none': uploadingLogo }">
          <span class="text-sm font-bold text-ink/70">{{ uploadingLogo ? 'Загрузка...' : 'Загрузить логотип или графику' }}</span>
          <span class="mt-1 block text-xs text-ink/45">PNG, JPG, WEBP — будет включён в генерацию</span>
          <input class="hidden" type="file" accept="image/jpeg,image/png,image/webp" :disabled="uploadingLogo" @change="handleLogoUpload">
        </label>
        <div v-if="logoPreview" class="relative mt-3 overflow-hidden rounded-2xl bg-white border border-line">
          <img :src="logoPreview" alt="Предпросмотр логотипа" class="max-h-40 w-full object-contain" />
          <button class="absolute right-2 top-2 rounded-full bg-ink/70 px-3 py-1 text-xs font-bold text-white backdrop-blur transition hover:bg-terracotta" @click="removeLogo">Удалить</button>
        </div>
      </div>

      <!-- Style -->
      <div>
        <label class="text-sm font-bold">Стиль</label>
        <div class="mt-2 grid grid-cols-3 gap-2">
          <button v-for="style in DESIGN_STYLES" :key="style.id" class="rounded-xl border bg-white p-3 text-left transition" :class="aiStyle === style.id ? 'border-sage bg-mint' : 'border-line'" @click="aiStyle = style.id">
            <span class="text-xs font-bold">{{ style.name }}</span>
            <span class="mt-1 block text-[10px] leading-4 text-ink/45">{{ style.description }}</span>
          </button>
        </div>
      </div>

      <!-- Color -->
      <div>
        <label class="text-sm font-bold">Цвет изделия <span class="font-normal text-ink/45">(необязательно)</span></label>
        <div class="mt-2 flex flex-wrap gap-2">
          <!-- @click qismida rangni olib tashlash imkoniyatini qo'shdik -->
          <button v-for="color in SHIRT_COLORS" :key="color.id" 
            class="flex items-center gap-2 rounded-xl border px-3 py-2.5 transition" 
            :class="aiColor === color.id ? 'border-sage ring-2 ring-sage/10 bg-mint' : 'border-line'" 
            @click="aiColor = aiColor === color.id ? null : color.id">
            <span class="h-5 w-5 rounded-full border border-line" :style="{ background: color.hex }" />
            <span class="text-xs font-bold">{{ color.name }}</span>
          </button>
        </div>
      </div>

      <!-- Prompt -->
      <div>
        <label class="text-sm font-bold">Описание дизайна</label>
        <textarea v-model="aiPrompt" class="mt-2 min-h-20 w-full resize-none rounded-2xl border border-line bg-cream px-4 py-3 text-sm outline-none focus:border-sage" placeholder="Опиши, какой дизайн хочешь увидеть на изделии — например, минималистичный логотип с горами на груди"></textarea>
      </div>

      <!-- Generate button -->
      <button class="w-full rounded-xl bg-sage px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#0a4ad4] disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:text-[#64748B]" :disabled="!canGenerate || generating" @click="generate">
        <span v-if="generating" class="flex items-center justify-center gap-2">
          <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          Генерация...
        </span>
        <span v-else>Сгенерировать дизайн</span>
      </button>

      <p v-if="genError" class="text-sm text-terracotta">{{ genError }}</p>

      <!-- Generated results -->
      <div v-if="generatedFront" class="space-y-3 mt-6">
        <p class="text-sm font-bold text-sage">Готово! Вот твой дизайн:</p>
        <div class="rounded-2xl border border-line bg-white p-3">
          <p class="mb-2 text-xs font-bold text-ink/55">Вид спереди и сзади</p>
          <img :src="generatedFront" alt="Дизайн одежды" class="w-full rounded-xl" />
        </div>
      </div>
    </div>

    <p v-if="error" class="mt-3 text-sm text-terracotta">{{ error }}</p>
    <BackNext back-to="/preview" :disabled="!order.draft.fabric || !order.draft.design" @next="goNext" />
  </div>
</template>

<script setup lang="ts">
import { EXISTING_DESIGNS, FABRICS } from '~/config/catalog'
import { DESIGN_STYLES, SHIRT_COLORS } from '~/types/design'
import type { Design } from '~/types/order'
import type { DesignStyle, ShirtColor, GenerateDesignResponse } from '~/types/design'

useSeoMeta({ robots: 'noindex, nofollow' })
const order = useOrderStore()
const error = ref('')
const activeTab = ref<'existing' | 'upload' | 'ai'>('existing')
const selectedExisting = computed(() => order.draft.design?.existingDesignId ?? '')

// --- Gemini orqali o'lchamlarni olish state'lari ---
const extractedDimensions = ref<{ chest_cm?: number; length_cm?: number; shoulder_cm?: number; sleeve_cm?: number } | null>(null)
const extractingDimensions = ref(false)
const extractError = ref('')

// --- Gemini'ga rasmni yuborib, o'lchamlarni oluvchi funksiya ---
async function extractDimensionsFromImage(imageUrl: string) {
  extractingDimensions.value = true
  extractError.value = ''
  extractedDimensions.value = null

  try {
    const response = await $fetch<{ success: boolean, dimensions: any }>('/api/design/extract-dimensions', {
      method: 'POST',
      body: {
        imageUrl: imageUrl,
        productType: order.draft.product?.name || 'Kiyim'
      }
    })
    
    if (response.success && response.dimensions) {
      extractedDimensions.value = response.dimensions
    }
  } catch (err: any) {
    extractError.value = err.message || "О'lchamlarni aniqlashda xatolik yuz berdi."
  } finally {
    extractingDimensions.value = false
  }
}

// Upload state
const uploadingLogo = ref(false)
const logoPreview = ref(order.draft.design?.uploadedImageUrl ?? '')
const logoUrl = ref<string | null>(order.draft.design?.uploadedImageUrl ?? null)
const logoName = ref(order.draft.design?.uploadedImageName ?? null)

// AI state
const aiStyle = ref<DesignStyle>(order.draft.design?.aiStyle as DesignStyle ?? 'minimal')
const aiColor = ref<ShirtColor | null>(order.draft.design?.aiColor as ShirtColor ?? null)
const aiPrompt = ref(order.draft.design?.aiPrompt ?? '')
const generating = ref(false)
const genError = ref('')
const generatedFront = ref(order.draft.design?.aiFrontImage ?? null)
const generatedBack = ref(order.draft.design?.aiBackImage ?? null)

const designTabs = [
  { id: 'existing' as const, label: 'Готовые' },
  { id: 'upload' as const, label: 'Загрузить' },
  { id: 'ai' as const, label: 'AI дизайн' }
]

const canGenerate = computed(() => aiPrompt.value.trim().length > 0 && order.draft.product !== null)

function selectExisting(design: { id: string; name: string }): void {
  logoPreview.value = ''
  logoUrl.value = null
  logoName.value = null
  generatedFront.value = null
  generatedBack.value = null
  extractedDimensions.value = null
  order.setDesign({ type: 'existing', existingDesignId: design.id, existingDesignName: design.name, uploadedImageUrl: null, uploadedImageName: null, additionalPrice: 0, aiPrompt: null, aiStyle: null, aiColor: null, aiFrontImage: null, aiBackImage: null })
}

async function handleLogoUpload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) { error.value = 'Файл слишком большой. Максимальный размер — 5 МБ.'; return }

  error.value = ''
  uploadingLogo.value = true

  const reader = new FileReader()
  reader.onload = async () => {
    const base64 = reader.result as string
    logoPreview.value = base64

    try {
      const response = await $fetch<{ url: string }>('/api/upload', {
        method: 'POST',
        body: {
          fileName: file.name,
          fileType: file.type,
          base64Data: base64
        }
      })

      logoUrl.value = response.url
      logoName.value = file.name

      // YANNGI: Rasm yuklanib bo'lishi bilan o'lchamlarni hisoblashni boshlaymiz
      if (activeTab.value === 'upload') {
        await extractDimensionsFromImage(response.url)
      }

      if (activeTab.value === 'upload' || activeTab.value === 'ai') {
        order.setDesign({ type: 'uploaded', existingDesignId: null, existingDesignName: null, uploadedImageUrl: response.url, uploadedImageName: file.name, additionalPrice: 0, aiPrompt: null, aiStyle: null, aiColor: null, aiFrontImage: null, aiBackImage: null })
      }
    } catch (err) {
      error.value = 'Ошибка при загрузке файла. Попробуйте еще раз.'
      logoPreview.value = ''
    } finally {
      uploadingLogo.value = false
    }
  }
  reader.readAsDataURL(file)
}

function removeLogo(): void {
  logoPreview.value = ''
  logoUrl.value = null
  logoName.value = null
  extractedDimensions.value = null
  extractError.value = ''
  if (activeTab.value === 'upload') {
    order.setDesign({ type: 'existing', existingDesignId: null, existingDesignName: null, uploadedImageUrl: null, uploadedImageName: null, additionalPrice: 0, aiPrompt: null, aiStyle: null, aiColor: null, aiFrontImage: null, aiBackImage: null })
  }
}

async function generate(): Promise<void> {
  if (!order.draft.product) { genError.value = 'Сначала выберите изделие'; return }
  if (!aiPrompt.value.trim()) { genError.value = 'Опишите желаемый дизайн'; return }

  generating.value = true
  genError.value = ''
  try {
    const result = await $fetch<GenerateDesignResponse>('/api/design/generate', {
      method: 'POST',
      body: {
        productType: order.draft.product.id,
        productName: order.draft.product.name,
        fabric: order.draft.fabric?.name ?? 'cotton',
        color: aiColor.value,
        style: aiStyle.value,
        prompt: aiPrompt.value,
        logoImageBase64: logoUrl.value,
        logoImageName: logoName.value,
        bodyInfo: order.draft.size?.customMeasurements ? JSON.stringify(order.draft.size.customMeasurements) : null
      }
    })
    generatedFront.value = result.frontImage
    generatedBack.value = result.backImage

    const design: Design = {
      type: 'ai',
      existingDesignId: null,
      existingDesignName: null,
      uploadedImageUrl: logoUrl.value,
      uploadedImageName: logoName.value,
      additionalPrice: 0,
      aiPrompt: aiPrompt.value,
      aiStyle: aiStyle.value,
      aiColor: aiColor.value,
      aiFrontImage: result.frontImage,
      aiBackImage: result.backImage
    }
    order.setDesign(design)
  } catch (err: unknown) {
    genError.value = err instanceof Error ? err.message : 'Не удалось сгенерировать дизайн. Проверьте настройки и попробуйте ещё раз.'
  } finally {
    generating.value = false
  }
}

function goNext(): void {
  if (!order.draft.fabric) { error.value = 'Выберите ткань'; return }
  if (!order.draft.design) { error.value = 'Выберите дизайн или создайте свой'; return }
  navigateTo('/measurements')
}
</script>