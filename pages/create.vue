<template>
  <div class="slide-up pb-8">
    <StepHeader :step="1" eyebrow="Контакт" title="Начнём с тебя" description="Данные из Telegram помогут оформить заказ быстрее." />
    <div class="rounded-2xl border border-line bg-white p-5">
      <div class="flex items-center gap-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-mint text-xl font-bold text-sage">{{ initials }}</div>
        <div><p class="font-bold">{{ order.displayName }}</p><p class="mt-1 text-sm text-ink/50">{{ telegramLabel }}</p></div>
      </div>
      <div class="mt-6">
        <label class="text-sm font-bold">Номер телефона</label>
        <button v-if="!order.draft.customer.phone && webApp?.requestContact" class="mt-2 w-full rounded-2xl border border-sage bg-mint px-4 py-4 text-left text-sm font-bold text-sage" @click="getPhone">Получить номер через Telegram</button>
        <div v-else-if="order.draft.customer.phone" class="mt-2 rounded-2xl bg-mint px-4 py-4 text-sm font-bold text-sage">{{ order.draft.customer.phone }}<button class="float-right font-medium underline" @click="getPhone">Изменить</button></div>
        <input v-else v-model="phoneInput" class="mt-2 w-full rounded-2xl border border-line bg-cream px-4 py-4 text-sm outline-none focus:border-sage" type="tel" placeholder="+998 90 123 45 67" @input="saveBrowserPhone" />
        <p v-if="!webApp?.requestContact && !order.draft.customer.phone" class="mt-2 text-xs text-ink/45">В обычном браузере можно указать номер вручную.</p>
        <p v-if="error" class="mt-2 text-sm text-terracotta">{{ error }}</p>
        <p class="mt-3 text-xs leading-5 text-ink/45">Мы используем номер только для связи по заказу.</p>
      </div>
    </div>
    <BackNext class="mt-8" :disabled="!order.hasContact" next-label="Далее" @next="goNext" />
  </div>
</template>

<script setup lang="ts">
const order = useOrderStore()
const { customer, requestContact, webApp } = useTelegram()
const error = ref('')
const phoneInput = ref(order.draft.customer.phone)

onMounted(() => {
  order.setCustomer({ telegramId: customer.value.telegramId ?? 0, firstName: customer.value.firstName || 'Гость', lastName: customer.value.lastName, username: customer.value.username })
})

const initials = computed(() => (order.draft.customer.firstName?.[0] ?? 'C').toUpperCase())
const telegramLabel = computed(() => order.draft.customer.username ? `@${order.draft.customer.username}` : 'Telegram аккаунт')

function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('998')) return '+' + digits
  if (digits.length === 9) return '+998' + digits
  if (digits.length > 0) return '+' + digits
  return ''
}

function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('998') && digits.length === 12) return true
  if (digits.length === 9 && !raw.startsWith('+')) return true
  return digits.length >= 9
}

function saveBrowserPhone(): void {
  const trimmed = phoneInput.value.trim()
  if (!trimmed) { order.setCustomer({ phone: '' }); error.value = ''; return }
  if (!isValidPhone(trimmed)) { error.value = 'Введите корректный номер, например +998 90 123 45 67'; order.setCustomer({ phone: '' }); return }
  error.value = ''
  order.setCustomer({ phone: normalizePhone(trimmed) })
}

async function getPhone(): Promise<void> {
  error.value = ''
  const phone = await requestContact()
  if (phone) order.setCustomer({ phone })
  else error.value = 'Не удалось отправить номер телефона. Попробуйте ещё раз в Telegram.'
}

function goNext(): void {
  saveBrowserPhone()
  if (order.hasContact) navigateTo('/preview')
}
</script>
