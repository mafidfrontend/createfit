<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '~/components/AppHeader.vue'
import AppButton from '~/components/AppButton.vue'
import DesignPrompt from '~/components/create/DesignPrompt.vue'
import DesignUpload from '~/components/create/DesignUpload.vue'
import FabricSelector from '~/components/create/FabricSelector.vue'
import ProductTypeSelector from '~/components/create/ProductTypeSelector.vue'
import DesignStyleSelector from '~/components/create/DesignStyleSelector.vue'
import DesignColorSelector from '~/components/create/DesignColorSelector.vue'
import PriceEstimate from '~/components/create/PriceEstimate.vue'
import { useDesign } from '~/composables/useDesign'
import type { DesignStyle, ShirtColor } from '~/types/design'

const router = useRouter()
const designStore = useDesignStore()
const { generateDesign, isLoading, error } = useDesign()

const prompt = ref('')
const referenceImage = ref<string | null>(null)
const fabricId = ref<string | null>(null)
const productId = ref<string | null>(null)
const style = ref<DesignStyle>('streetwear')
const shirtColor = ref<ShirtColor>('black')

const canSubmit = computed(() => {
  return prompt.value.trim().length > 0 && fabricId.value !== null && productId.value !== null
})

function goBack() {
  router.push('/')
}

async function submit() {
  if (!canSubmit.value || !productId.value || !fabricId.value) return

  designStore.startDesign(
    productId.value,
    fabricId.value,
    prompt.value,
    referenceImage.value,
    style.value,
    shirtColor.value,
  )
  designStore.setGenerating(true)
  designStore.setGenerateError(null)

  const result = await generateDesign({
    prompt: prompt.value,
    style: style.value,
    shirtColor: shirtColor.value,
  })

  designStore.setGenerating(false)

  if (result) {
    designStore.setGeneratedImages(result.frontImage, result.backImage)
    router.push('/preview')
  } else {
    designStore.setGenerateError(error.value)
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <AppHeader title="Создать дизайн" show-back show-menu @back="goBack" />

    <main class="flex-1 overflow-y-auto px-5 pt-4 pb-28">
      <DesignPrompt v-model="prompt" />

      <div class="my-6 h-px bg-neutral-100" />

      <DesignUpload v-model="referenceImage" />

      <div class="my-6 h-px bg-neutral-100" />

      <FabricSelector v-model="fabricId" />

      <div class="my-6 h-px bg-neutral-100" />

      <DesignStyleSelector v-model="style" />

      <div class="my-6 h-px bg-neutral-100" />

      <DesignColorSelector v-model="shirtColor" />

      <div class="my-6 h-px bg-neutral-100" />

      <ProductTypeSelector v-model="productId" />

      <div class="mt-6">
        <PriceEstimate :product-id="productId" :fabric-id="fabricId" />
      </div>

      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div v-if="designStore.generateError" class="mt-4 rounded-2xl bg-error-50 px-4 py-3">
          <p class="text-sm font-medium text-error-700">{{ designStore.generateError }}</p>
        </div>
      </Transition>
    </main>

    <div class="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-neutral-100 bg-white/95 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md">
      <AppButton
        size="lg"
        full-width
        :loading="designStore.isGenerating"
        :disabled="!canSubmit || designStore.isGenerating"
        @click="submit"
      >
        {{ designStore.isGenerating ? 'Генерация...' : 'Создать дизайн' }}
      </AppButton>
    </div>
  </div>
</template>
