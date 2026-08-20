<template>
  <div class="slide-up pb-8">
    <div class="mb-7">
      <p class="text-xs font-bold uppercase tracking-[.16em] text-sage">История</p>
      <h1 class="mt-2 text-[30px] font-extrabold leading-[1.08] tracking-[-.04em]">Мои заказы</h1>
      <p class="mt-3 text-[15px] leading-6 text-ink/55">Все твои заказы в одном месте.</p>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <svg class="h-7 w-7 animate-spin text-sage" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
    </div>

    <div v-else-if="error" class="rounded-2xl border border-line bg-white p-5 text-center">
      <p class="text-sm text-terracotta">{{ error }}</p>
      <button class="mt-4 text-sm font-bold text-sage underline" @click="loadOrders">Повторить</button>
    </div>

    <div v-else-if="orders.length === 0" class="rounded-[22px] border border-line bg-[#FAFBFD] px-6 py-12 text-center">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint text-2xl text-sage">☰</div>
      <h2 class="mt-6 text-xl font-extrabold tracking-[-.03em]">У вас пока нет заказов</h2>
      <p class="mt-3 text-sm leading-6 text-ink/55">Создайте своё первое изделие — это займёт пару минут.</p>
      <NuxtLink to="/create" class="mt-7 inline-block rounded-xl bg-sage px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#0a4ad4]">Создать изделие</NuxtLink>
    </div>

    <div v-else class="space-y-4">
      <div v-for="order in orders" :key="order.id" class="rounded-2xl border border-line bg-white p-5">
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-sage">Заказ #{{ order.id }}</span>
          <span class="rounded-full bg-mint px-3 py-1 text-xs font-bold text-sage">{{ statusLabel(order.payment_status) }}</span>
        </div>

        <div v-if="order.design?.aiFrontImage" class="mt-4 grid grid-cols-2 gap-2">
          <img :src="order.design.aiFrontImage" alt="Дизайн спереди" class="w-full rounded-xl" />
          <img v-if="order.design.aiBackImage" :src="order.design.aiBackImage" alt="Дизайн сзади" class="w-full rounded-xl" />
        </div>

        <div class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between gap-4"><span class="text-ink/55">Изделие</span><b class="text-right">{{ order.product?.name ?? '—' }}</b></div>
          <div class="flex justify-between gap-4"><span class="text-ink/55">Размер</span><b class="text-right">{{ sizeLabel(order) }}</b></div>
          <div class="flex justify-between gap-4"><span class="text-ink/55">Дизайн</span><b class="text-right">{{ designLabel(order) }}</b></div>
          <div class="flex justify-between gap-4"><span class="text-ink/55">Сумма</span><b class="text-right text-sage">{{ formatUsd(order.total_price) }}</b></div>
          <div class="flex justify-between gap-4"><span class="text-ink/55">Доставка</span><b class="text-right">{{ order.city }}</b></div>
          <div class="flex justify-between gap-4 border-t border-line pt-2"><span class="text-ink/55">Дата</span><b class="text-right">{{ formatDate(order.created_at) }}</b></div>
        </div>

        <div class="mt-4 rounded-xl bg-mint px-4 py-3 text-sm font-bold text-sage">Срок изготовления: {{ order.manufacturing_days }} дней</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatUsd } from '~/utils/pricing'

interface OrderRow {
  id: string
  product: { name: string } | null
  fabric: { name: string } | null
  design: { type: string; existingDesignName: string | null; uploadedImageUrl: string | null; aiPrompt: string | null; aiFrontImage: string | null; aiBackImage: string | null } | null
  size: string | null
  custom_measurements: Record<string, string> | null
  payment_status: string
  total_price: number
  city: string
  manufacturing_days: number
  created_at: string
}

const { telegramUser } = useTelegram()
const orders = ref<OrderRow[]>([])
const loading = ref(true)
const error = ref('')

async function loadOrders(): Promise<void> {
  const telegramId = telegramUser.value?.id
  if (!telegramId) {
    loading.value = false
    error.value = 'Не удалось определить пользователя Telegram. Откройте приложение через Telegram.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    orders.value = await $fetch<OrderRow[]>('/api/orders', { query: { telegram_id: telegramId } })
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Не удалось загрузить заказы'
  } finally {
    loading.value = false
  }
}

onMounted(loadOrders)

function statusLabel(status: string): string {
  const map: Record<string, string> = { pending: 'Заказ принят', paid: 'В работе', failed: 'Нужно уточнение', cancelled: 'Отменён' }
  return map[status] ?? 'Заказ принят'
}

function sizeLabel(order: OrderRow): string {
  if (order.size) return order.size
  if (order.custom_measurements) return 'Индивидуальный'
  return '—'
}

function designLabel(order: OrderRow): string {
  if (!order.design) return '—'
  if (order.design.type === 'ai') return order.design.aiPrompt ? `AI: ${order.design.aiPrompt.slice(0, 40)}${order.design.aiPrompt.length > 40 ? '...' : ''}` : 'AI дизайн'
  if (order.design.type === 'uploaded') return 'Свой дизайн'
  return order.design.existingDesignName ?? '—'
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}
</script>
