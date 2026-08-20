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
        <button v-if="!order.draft.customer.phone && webApp?.requestContact" class="mt-2 w-full rounded-2xl border border-sage bg-mint px-4 py-4 text-left text-sm font-bold text-sage" @click="getPhone">Получить номер через Telegram</button>
        <div v-else-if="order.draft.customer.phone" class="mt-2 rounded-2xl bg-mint px-4 py-4 text-sm font-bold text-sage">{{ order.draft.customer.phone }}<button class="float-right font-medium underline" @click="getPhone">Изменить</button></div>
        <div v-else class="mt-2 flex">
          <select v-model="countryCode" class="rounded-l-2xl border border-r-0 border-line bg-white px-3 py-4 text-sm font-bold text-ink outline-none focus:border-sage">
            <option v-for="c in countries" :key="c.code" :value="c.dial">{{ c.flag }} {{ c.dial }}</option>
          </select>
          <input v-model="phoneInput" class="w-full rounded-r-2xl border border-line bg-cream px-4 py-4 text-sm outline-none focus:border-sage" type="tel" placeholder="90 123 45 67" @input="saveBrowserPhone" />
        </div>
        <p v-if="!webApp?.requestContact && !order.draft.customer.phone" class="mt-2 text-xs text-ink/45">В обычном браузере можно указать номер вручную.</p>
        <p v-if="error" class="mt-2 text-sm text-terracotta">{{ error }}</p>
        <p class="mt-3 text-xs leading-5 text-ink/45">Мы используем номер только для связи по заказу.</p>
      </div>
    </div>
    <BackNext class="mt-8" :disabled="!order.hasContact" next-label="Далее" @next="goNext" />
  </div>
</template>

<script setup lang="ts">
useSeoMeta({ robots: 'noindex, nofollow' })
const order = useOrderStore()
const { customer, requestContact, webApp } = useTelegram()
const error = ref('')
const phoneInput = ref(order.draft.customer.phone.replace(order.draft.customer.countryCode ?? '+998', ''))
const countryCode = ref(order.draft.customer.countryCode ?? '+998')
const firstName = ref(order.draft.customer.firstName)

const countries = [
  { code: 'UZ', dial: '+998', flag: '🇺🇿' },
  { code: 'KZ', dial: '+7', flag: '🇰🇿' },
  { code: 'KG', dial: '+996', flag: '🇰🇬' },
  { code: 'TJ', dial: '+992', flag: '🇹🇯' },
  { code: 'TM', dial: '+993', flag: '🇹🇲' },
  { code: 'RU', dial: '+7', flag: '🇷🇺' },
  { code: 'CN', dial: '+86', flag: '🇨🇳' },
  { code: 'TR', dial: '+90', flag: '🇹🇷' },
  { code: 'AE', dial: '+971', flag: '🇦🇪' },
  { code: 'US', dial: '+1', flag: '🇺🇸' },
  { code: 'DE', dial: '+49', flag: '🇩🇪' },
  { code: 'GB', dial: '+44', flag: '🇬🇧' }
]

onMounted(() => {
  order.setCustomer({ telegramId: customer.value.telegramId ?? 0, firstName: customer.value.firstName || 'Гость', lastName: customer.value.lastName, username: customer.value.username, countryCode: countryCode.value })
})

const initials = computed(() => (order.draft.customer.firstName?.[0] ?? 'C').toUpperCase())
const telegramLabel = computed(() => order.draft.customer.username ? `@${order.draft.customer.username}` : 'Telegram аккаунт')

function saveName(): void {
  order.setCustomer({ firstName: firstName.value.trim() || 'Гость' })
}

const countryLengths: Record<string, number> = {
  '+998': 9, '+7': 10, '+996': 9, '+992': 9, '+993': 8,
  '+86': 11, '+90': 10, '+971': 9, '+1': 10, '+49': 10, '+44': 10
}

function isValidPhone(raw: string, dial: string): boolean {
  const digits = raw.replace(/\D/g, '')
  const required = countryLengths[dial] ?? 7
  return digits.length === required
}

function saveBrowserPhone(): void {
  const trimmed = phoneInput.value.trim()
  if (!trimmed) { order.setCustomer({ phone: '' }); error.value = ''; return }
  if (!isValidPhone(trimmed, countryCode.value)) {
    const needed = countryLengths[countryCode.value] ?? 7
    error.value = `Номер должен содержать ${needed} цифр после кода страны`
    order.setCustomer({ phone: '' })
    return
  }
  error.value = ''
  order.setCustomer({ phone: countryCode.value + trimmed.replace(/\s/g, ''), countryCode: countryCode.value })
}

async function getPhone(): Promise<void> {
  error.value = ''
  const phone = await requestContact()
  if (phone) order.setCustomer({ phone })
  else error.value = 'Не удалось отправить номер телефона. Попробуйте ещё раз в Telegram.'
}

function goNext(): void {
  saveBrowserPhone()
  if (!order.hasContact) {
    if (!error.value) error.value = 'Введите корректный номер телефона'
    return
  }
  navigateTo('/preview')
}
</script>
