<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '~/components/AppHeader.vue'
import AppButton from '~/components/AppButton.vue'
import DesignPrompt from '~/components/create/DesignPrompt.vue'
import DesignUpload from '~/components/create/DesignUpload.vue'
import FabricSelector from '~/components/create/FabricSelector.vue'
import ProductTypeSelector from '~/components/create/ProductTypeSelector.vue'
import PriceEstimate from '~/components/create/PriceEstimate.vue'

const router = useRouter()
const designStore = useDesignStore()

const prompt = ref('')
const referenceImage = ref<string | null>(null)
const fabricId = ref<string | null>(null)
const productId = ref<string | null>(null)

const canSubmit = computed(() => {
  return prompt.value.trim().length > 0 && fabricId.value !== null && productId.value !== null
})

function goBack() {
  router.push('/')
}

function submit() {
  if (!canSubmit.value || !productId.value || !fabricId.value) return
  designStore.startDesign(productId.value, fabricId.value, prompt.value, referenceImage.value)
  router.push('/preview')
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

      <ProductTypeSelector v-model="productId" />

      <div class="mt-6">
        <PriceEstimate :product-id="productId" :fabric-id="fabricId" />
      </div>
    </main>

    <div class="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-neutral-100 bg-white/95 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md">
      <AppButton
        size="lg"
        full-width
        :disabled="!canSubmit"
        @click="submit"
      >
        Создать дизайн
      </AppButton>
    </div>
  </div>
</template>
