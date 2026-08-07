<script setup lang="ts">
import AppTextarea from '~/components/AppTextarea.vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <AppTextarea
    :model-value="modelValue"
    label="Комментарий к заказу"
    placeholder="Например: позвонить за час до доставки"
    :rows="3"
    :max-length="500"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
