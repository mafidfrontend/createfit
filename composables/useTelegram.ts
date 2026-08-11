import type { Customer } from '~/types/order'

declare global {
  interface Window { Telegram?: { WebApp?: TelegramWebApp } }
}
interface TelegramUser { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string }
interface TelegramWebApp { initData?: string; initDataUnsafe?: { user?: TelegramUser }; ready?: () => void; expand?: () => void; requestContact?: (callback: (success: boolean, response?: { contact?: { phone_number?: string } }) => void) => void; HapticFeedback?: { impactOccurred: (style: string) => void } }

export function useTelegram() {
  const webApp = computed(() => import.meta.client ? window.Telegram?.WebApp : undefined)
  const telegramUser = computed(() => webApp.value?.initDataUnsafe?.user)
  const customer = computed<Customer>(() => ({
    telegramId: telegramUser.value?.id ?? null,
    firstName: telegramUser.value?.first_name ?? '',
    lastName: telegramUser.value?.last_name ?? '',
    username: telegramUser.value?.username ?? null,
    phone: ''
  }))
  function initialize(): void { webApp.value?.ready?.(); webApp.value?.expand?.() }
  function requestContact(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!webApp.value?.requestContact) { resolve(null); return }
      webApp.value.requestContact((success, response) => resolve(success ? response?.contact?.phone_number ?? null : null))
    })
  }
  function haptic(): void { webApp.value?.HapticFeedback?.impactOccurred('light') }
  return { webApp, telegramUser, customer, initialize, requestContact, haptic }
}
