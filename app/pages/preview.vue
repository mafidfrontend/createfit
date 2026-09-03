<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'
import PreviewImage from '../components/preview/PreviewImage.vue'
import PreviewSummary from '../components/preview/PreviewSummary.vue'
import PreviewChat from '../components/preview/PreviewChat.vue'
import { useDesign } from '../composables/useDesign'

const router = useRouter()
const designStore = useDesignStore()
const { generateDesign, isLoading } = useDesign()

const hasDesign = computed(() => designStore.current !== null)

onMounted(() => {
  if (!designStore.current) {
    router.replace('/create')
  }
})

function goBack() {
  router.push('/create')
}

async function regenerate() {
  if (!designStore.current || isLoading.value) return
  designStore.setRegenerating(true)
  designStore.setGenerateError(null)

  const result = await generateDesign({
    prompt: designStore.current.prompt,
    style: designStore.style,
    shirtColor: designStore.shirtColor,
    // Agar logo bo'lsa, bu yerda qo'shib yuborish kerak:
    // uploadedImageUrl: designStore.current.uploadedImageUrl 
  })

  designStore.setRegenerating(false)

  if (result) {
    // Endi orqa rasm yo'q, faqat bitta umumiy (frontImage) rasmni saqlaymiz
    designStore.setGeneratedImages(result.frontImage, null)
  } else {
    designStore.setGenerateError('Не удалось пересоздать дизайн. Попробуйте ещё раз.')
  }
}

function continueToNext() {
  designStore.saveToHistory()
  router.push('/measurements')
}
</script>

<template>
  <div v-if="hasDesign && designStore.current" class="flex flex-1 flex-col">
    <AppHeader title="Предварительный результат" show-back show-menu @back="goBack" />

    <main class="flex-1 overflow-y-auto px-5 pt-4 pb-28">
      
      <!-- PreviewToggle olib tashlandi, chunki rasmimiz bitta (yonma-yon) -->
      
      <PreviewImage
        side="front"
        :front-image="designStore.current.frontImage"
        :back-image="null"
        :is-generating="designStore.isRegenerating"
      />

      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div v-if="designStore.generateError" class="mt-4 rounded-2xl bg-error-50 px-4 py-3">
          <p class="text-sm font-medium text-error-700">{{ designStore.generateError }}</p>
        </div>
      </Transition>

      <div class="mt-5">
        <PreviewSummary :design="designStore.current" @edit-prompt="regenerate" />
      </div>

      <div class="mt-5">
        <PreviewChat />
      </div>
    </main>

    <div class="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-neutral-100 bg-white/95 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md">
      <div class="flex gap-3">
        <AppButton variant="outline" size="lg" class="flex-1" :loading="designStore.isRegenerating" @click="regenerate">
          {{ designStore.isRegenerating ? 'Генерация...' : 'Перегенерировать' }}
        </AppButton>
        <AppButton variant="primary" size="lg" class="flex-[1.5]" @click="continueToNext">
          Продолжить
        </AppButton>
      </div>
    </div>
  </div>
</template>