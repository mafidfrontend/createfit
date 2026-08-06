<script setup lang="ts">
import AppSectionHeader from '~/components/AppSectionHeader.vue'
import AppUpload from '~/components/AppUpload.vue'

const props = defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

function update(value: string | null) {
  emit('update:modelValue', value)
}
</script>

<template>
  <section>
    <AppSectionHeader
      :number="2"
      title="Загрузите изображение"
      optional
      description="Мы используем ваше фото как основу для дизайна"
    />
    <AppUpload
      :model-value="modelValue"
      hint="PNG, JPG до 10MB"
      @update:model-value="update"
    />
  </section>
</template>
