<script setup lang="ts">
import AppInput from '~/components/AppInput.vue'
import type { PersonalInfo } from '~/types'

const props = defineProps<{
  modelValue: PersonalInfo
  deliveryRequiresAddress: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PersonalInfo]
}>()

function update(field: keyof PersonalInfo, value: string) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}
</script>

<template>
  <div class="space-y-4">
    <AppInput
      :model-value="modelValue.fullName"
      label="ФИО получателя"
      placeholder="Иван Иванов"
      @update:model-value="update('fullName', $event)"
    />

    <AppInput
      :model-value="modelValue.phone"
      label="Телефон"
      placeholder="+7 (999) 123-45-67"
      type="tel"
      input-mode="tel"
      @update:model-value="update('phone', $event)"
    />

    <AppInput
      :model-value="modelValue.email"
      label="Email"
      placeholder="ivan@example.com"
      type="email"
      input-mode="email"
      @update:model-value="update('email', $event)"
    />

    <template v-if="deliveryRequiresAddress">
      <AppInput
        :model-value="modelValue.city"
        label="Город"
        placeholder="Москва"
        @update:model-value="update('city', $event)"
      />

      <AppInput
        :model-value="modelValue.address"
        label="Адрес доставки"
        placeholder="ул. Пушкина, д. 10, кв. 5"
        @update:model-value="update('address', $event)"
      />

      <AppInput
        :model-value="modelValue.postalCode"
        label="Почтовый индекс"
        placeholder="123456"
        type="number"
        input-mode="numeric"
        @update:model-value="update('postalCode', $event)"
      />
    </template>
  </div>
</template>
