<template>
  <div class="slide-up pb-8">
    <StepHeader :step="1" eyebrow="Контакт" title="Начнём с тебя" description="Данные из Telegram помогут оформить заказ быстрее." />
    <div class="rounded-2xl border border-line bg-white p-5">
      <div class="flex items-center gap-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-mint text-xl font-bold text-sage">{{ initials }}</div>
        <div><p class="font-bold">{{ order.displayName }}</p><p class="mt-1 text-sm text-ink/50">{{ telegramLabel }}</p></div>
      </div>
      <div class="mt-6">
        <label class="text-sm font-bold">Имя</label>
        <input v-model="firstName" class="mt-2 w-full rounded-2xl border border-line bg-cream px-4 py-4 text-sm outline-none focus:border-sage" type="text" placeholder="Ваше имя" @input="saveName" />
      </div>
      <div class="mt-4">
        <label class="text-sm font-bold">Номер телефона</label>
        <input v-model="phoneInput" class="mt-2 w-full rounded-2xl border border-line bg-cream px-4 py-4 text-sm outline-none focus:border-sage" type="tel" placeholder="+998 90 123 45 67" @input="onPhoneInput" />
        <button v-if="webApp?.requestContact" class="mt-2 w-full rounded-2xl border border-sage bg-mint px-4 py-4 text-left text-sm font-bold text-sage" @click="getPhone">Получить номер через Telegram</button>
        <p v-if="error" class="mt-2 text-sm text-terracotta">{{ error }}</p>
        <p class="mt-3 text-xs leading-5 text-ink/45">Введите номер в международном формате, например +998 90 123 45 67.</p>
      </div>
    </div>
    <BackNext class="mt-8" :disabled="!order.hasContact" next-label="Далее" @next="goNext" />
  </div>
</template>

<script setup lang="ts">
import { normalizePhone, formatPhone } from '~/utils/phone'

useSeoMeta({ robots: 'noindex, nofollow' })
const order = useOrderStore()
const { customer, requestContact, webApp, user, authenticate, error: authError } = useTelegram()
const error = ref('')
const phoneInput = ref(order.draft.customer.phone ? formatPhone(order.draft.customer.phone) : '')
const firstName = ref(order.draft.customer.firstName)

onMounted(async () => {
  if (!user.value) await authenticate()
  if (user.value) {
    order.setCustomer({ telegramId: user.value.id, firstName: user.value.firstName || 'Гость', lastName: user.value.lastName, username: user.value.username })
  } else if (customer.value.telegramId) {
    order.setCustomer({ telegramId: customer.value.telegramId, firstName: customer.value.firstName || 'Гость', lastName: customer.value.lastName, username: customer.value.username })
  }
})

const initials = computed(() => (order.draft.customer.firstName?.[0] ?? 'C').toUpperCase())
const telegramLabel = computed(() => order.draft.customer.username ? `@${order.draft.customer.username}` : 'Telegram аккаунт')

function saveName(): void {
  order.setCustomer({ firstName: firstName.value.trim() || 'Гость' })
}

function onPhoneInput(): void {
  const formatted = formatPhone(phoneInput.value)
  if (formatted !== phoneInput.value) phoneInput.value = formatted

  const trimmed = phoneInput.value.trim()
  if (!trimmed) { order.setCustomer({ phone: '' }); error.value = ''; return }

  const normalized = normalizePhone(trimmed)
  if (!normalized) {
    if (trimmed.length >= 4) {
      error.value = 'Введите корректный номер телефона'
    } else {
      error.value = ''
    }
    order.setCustomer({ phone: '' })
    return
  }
  error.value = ''
  order.setCustomer({ phone: normalized })
}

async function getPhone(): Promise<void> {
  error.value = ''
  const phone = await requestContact()
  if (!phone) {
    error.value = 'Не удалось отправить номер телефона. Попробуйте ещё раз в Telegram.'
    return
  }
  const normalized = normalizePhone(phone)
  if (!normalized) {
    error.value = 'Получен некорректный номер телефона. Введите номер вручную.'
    return
  }
  phoneInput.value = formatPhone(normalized)
  order.setCustomer({ phone: normalized })
}

function goNext(): void {
  onPhoneInput()
  if (!order.hasContact) {
    if (!error.value) error.value = 'Введите корректный номер телефона'
    return
  }
  navigateTo('/preview')
}
</script>
