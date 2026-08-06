<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '~/components/AppHeader.vue'
import AppButton from '~/components/AppButton.vue'
import PreviewToggle from '~/components/preview/PreviewToggle.vue'
import PreviewImage from '~/components/preview/PreviewImage.vue'
import PreviewSummary from '~/components/preview/PreviewSummary.vue'
import PreviewChat from '~/components/preview/PreviewChat.vue'

const router = useRouter()
const designStore = useDesignStore()

type Side = 'front' | 'back'
const activeSide = ref<Side>('front')

const hasDesign = computed(() => designStore.current !== null)

onMounted(() => {
  if (!designStore.current) {
    router.replace('/create')
  }
})

function goBack() {
  router.push('/create')
}

function editPrompt(newPrompt: string) {
  designStore.updatePrompt(newPrompt)
  designStore.setRegenerating(true)
  setTimeout(() => {
    designStore.setRegenerating(false)
  }, 1500)
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
      <!-- Preview toggle + image -->
      <div class="mb-4">
        <PreviewToggle v-model="activeSide" />
      </div>
      <PreviewImage
        :side="activeSide"
        :front-image="designStore.current.frontImage"
        :back-image="designStore.current.backImage"
        :is-generating="designStore.isRegenerating"
      />

      <!-- Summary -->
      <div class="mt-5">
        <PreviewSummary :design="designStore.current" @edit-prompt="editPrompt" />
      </div>

      <!-- AI Chat -->
      <div class="mt-5">
        <PreviewChat />
      </div>
    </main>

    <!-- Bottom action bar -->
    <div class="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-neutral-100 bg-white/95 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md">
      <div class="flex gap-3">
        <AppButton variant="outline" size="lg" class="flex-1" @click="goBack">
          Редактировать
        </AppButton>
        <AppButton variant="primary" size="lg" class="flex-[1.5]" @click="continueToNext">
          Продолжить
        </AppButton>
      </div>
    </div>
  </div>
</template>
