<script setup lang="ts">
import { ref, computed } from 'vue'
import { getFabricById, getProductById, calculatePrice } from '~/config/products'
import { FABRIC_ICON_PATHS } from '~/config/icons'
import { useFormat } from '~/composables/useFormat'
import { BRAND_TEXT } from '~/config/navigation'
import type { Design } from '~/types'

const props = defineProps<{
  design: Design
}>()

const emit = defineEmits<{
  editPrompt: [prompt: string]
}>()

const { formatPrice } = useFormat()

const isEditing = ref(false)
const editedPrompt = ref(props.design.prompt)

const product = computed(() => {
  if (!props.design.productId) return null
  return getProductById(props.design.productId) ?? null
})

const fabric = computed(() => {
  if (!props.design.fabricId) return null
  return getFabricById(props.design.fabricId) ?? null
})

const price = computed(() => {
  if (!props.design.productId || !props.design.fabricId) return 0
  return calculatePrice(props.design.productId, props.design.fabricId)
})

function startEdit() {
  editedPrompt.value = props.design.prompt
  isEditing.value = true
}

function saveEdit() {
  if (editedPrompt.value.trim().length > 0) {
    emit('editPrompt', editedPrompt.value)
  }
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between rounded-2xl bg-primary-50 px-5 py-4">
      <div class="flex flex-col">
        <span class="text-xs font-medium text-neutral-500">Итого от</span>
        <span class="text-2xl font-extrabold text-primary-700">{{ formatPrice(price) }}</span>
      </div>
      <div class="flex flex-col items-end gap-1">
        <span class="text-sm font-medium text-neutral-700">{{ product?.name }}</span>
        <span class="text-xs text-neutral-400">{{ fabric?.name }}</span>
      </div>
    </div>

    <div>
      <h3 class="mb-2 text-sm font-bold text-neutral-900">Ваш запрос</h3>
      <Transition
        mode="out-in"
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="isEditing" key="edit" class="space-y-2">
          <textarea
            v-model="editedPrompt"
            rows="4"
            maxlength="1000"
            class="w-full resize-none rounded-2xl border border-primary-300 bg-white px-4 py-3 text-[15px] text-neutral-900 focus:outline-none focus:border-primary-500"
            placeholder="Опишите ваш дизайн..."
          />
          <div class="flex gap-2">
            <button
              class="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-700 transition-colors active:bg-neutral-100"
              @click="cancelEdit"
            >
              Отмена
            </button>
            <button
              class="flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white transition-colors active:bg-primary-700"
              @click="saveEdit"
            >
              Применить
            </button>
          </div>
        </div>

        <div v-else key="view" class="rounded-2xl bg-primary-50 px-4 py-3">
          <p class="text-sm leading-relaxed text-neutral-700">{{ design.prompt }}</p>
          <button
            class="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 active:text-primary-700"
            @click="startEdit"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
            Изменить запрос
          </button>
        </div>
      </Transition>
    </div>

    <div v-if="fabric">
      <h3 class="mb-2 text-sm font-bold text-neutral-900">Выбранная ткань</h3>
      <div class="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
          <svg class="h-5 w-5 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path :d="FABRIC_ICON_PATHS[fabric.icon] ?? ''" />
          </svg>
        </div>
        <div class="flex flex-col">
          <span class="text-sm font-bold text-neutral-900">{{ fabric.name }}</span>
          <span class="text-xs text-neutral-400">{{ fabric.description }}</span>
        </div>
      </div>
    </div>

    <div v-if="design.referenceImage">
      <h3 class="mb-2 text-sm font-bold text-neutral-900">Загруженное изображение</h3>
      <div class="overflow-hidden rounded-2xl border border-neutral-200">
        <img :src="design.referenceImage" alt="Загруженное изображение" class="h-32 w-full object-cover" />
      </div>
    </div>

    <div class="pt-2 text-center">
      <span class="text-xs font-medium tracking-wide text-neutral-400">{{ BRAND_TEXT }}</span>
    </div>
  </div>
</template>
