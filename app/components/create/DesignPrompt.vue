<script setup lang="ts">
import AppSectionHeader from '~/components/AppSectionHeader.vue'
import AppTextarea from '~/components/AppTextarea.vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function update(value: string) {
  emit('update:modelValue', value)
}
</script>

<template>
  <section>
    <AppSectionHeader
      :number="1"
      title="Опишите свой дизайн"
      description="Расскажите, что вы хотите видеть на своей футболке. Чем подробнее, тем лучше результат."
    />
    <AppTextarea
      :model-value="modelValue"
      placeholder="Опишите ваш дизайн..."
      :max-length="1000"
      :rows="4"
      @update:model-value="update"
    />
  </section>
</template>
