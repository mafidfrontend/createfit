<script setup lang="ts">
import AppSectionHeader from '~/components/AppSectionHeader.vue'
import AppButton from '~/components/AppButton.vue'
import MeasurePhotoSlot from '~/components/measurements/MeasurePhotoSlot.vue'
import type { PhotoSlot } from '~/types'

defineProps<{
  frontPhoto: PhotoSlot
  sidePhoto: PhotoSlot
  canContinue: boolean
}>()

const emit = defineEmits<{
  uploadFront: [dataUrl: string]
  uploadSide: [dataUrl: string]
  retakeFront: []
  retakeSide: []
  continue: []
}>()

const FRONT_GUIDE = 'https://images.pexels.com/photos/9363120/pexels-photo-9363120.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
const SIDE_GUIDE = 'https://images.pexels.com/photos/33167552/pexels-photo-33167552.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'

const tips = [
  'Хорошее освещение',
  'Одежда облегающая',
  'Лист А4 при себе',
  'Встаньте ровно, лист бумаги перед собой',
]
</script>

<template>
  <div>
    <AppSectionHeader
      :number="1"
      title="Как это работает"
      description="Сфотографируйтесь спереди и сбоку с листом А4 для масштаба. AI точно снимет мерки без рулетки."
    />

    <div class="grid grid-cols-2 gap-3">
      <MeasurePhotoSlot
        label="Спереди"
        :guide-image="FRONT_GUIDE"
        :uploaded-image="frontPhoto.dataUrl"
        :state="frontPhoto.state"
        @upload="emit('uploadFront', $event)"
        @retake="emit('retakeFront')"
      />
      <MeasurePhotoSlot
        label="Сбоку"
        :guide-image="SIDE_GUIDE"
        :uploaded-image="sidePhoto.dataUrl"
        :state="sidePhoto.state"
        @upload="emit('uploadSide', $event)"
        @retake="emit('retakeSide')"
      />
    </div>

    <div class="mt-5 rounded-2xl bg-primary-50 px-4 py-4">
      <div class="flex items-center gap-2">
        <svg class="h-5 w-5 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <span class="text-sm font-bold text-primary-700">Важно для точности:</span>
      </div>
      <ul class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
        <li v-for="tip in tips" :key="tip" class="flex items-center gap-1.5 text-xs text-neutral-600">
          <span class="text-primary-500">•</span>
          <span>{{ tip }}</span>
        </li>
      </ul>
    </div>

    <div class="mt-6">
      <AppButton size="lg" full-width :disabled="!canContinue" @click="emit('continue')">
        Далее
      </AppButton>
    </div>
  </div>
</template>
