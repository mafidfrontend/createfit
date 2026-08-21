import type { Customer } from '~/types/order'

declare global {
  interface Window { Telegram?: { WebApp?: TelegramWebApp } }
}
interface TelegramUser { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string; photo_url?: string }
interface TelegramWebApp {
  initData?: string
  initDataUnsafe?: { user?: TelegramUser }
  ready?: () => void
  expand?: () => void
  requestContact?: (callback: (success: boolean, response?: { contact?: { phone_number?: string } }) => void) => void
  HapticFeedback?: { impactOccurred: (style: string) => void }
  colorScheme?: 'light' | 'dark'
  setHeaderColor?: (color: string) => void
}

export interface AuthenticatedUser {
  id: number
  firstName: string
  lastName: string
  username: string | null
  languageCode: string | null
  photoUrl: string | null
}

const authUser = useState<AuthenticatedUser | null>('tg-auth-user', () => null)
const authError = useState<string>('tg-auth-error', () => '')
const authLoading = useState<boolean>('tg-auth-loading', () => false)

export function useTelegram() {
  const webApp = computed<TelegramWebApp | undefined>(() => import.meta.client ? window.Telegram?.WebApp : undefined)
  const isAvailable = computed(() => Boolean(webApp.value))
  const initData = computed(() => webApp.value?.initData ?? '')
  const telegramUser = computed(() => webApp.value?.initDataUnsafe?.user)
  const user = computed(() => authUser.value)
  const isAuthenticated = computed(() => Boolean(authUser.value))
  const error = computed(() => authError.value)
  const loading = computed(() => authLoading.value)

  const customer = computed<Customer>(() => {
    const u = authUser.value ?? telegramUser.value
    return {
      telegramId: u?.id ?? null,
      firstName: u?.first_name ?? '',
      lastName: u?.last_name ?? '',
      username: u?.username ?? null,
      phone: ''
    }
  })

  function initialize(): void {
    if (!import.meta.client) return
    const wa = window.Telegram?.WebApp
    if (!wa) return
    wa.ready?.()
    wa.expand?.()
  }

  async function authenticate(): Promise<AuthenticatedUser | null> {
    if (!import.meta.client) return null
    const wa = window.Telegram?.WebApp
    if (!wa) {
      authError.value = 'Откройте приложение через Telegram'
      return null
    }
    wa.ready?.()
    const data = wa.initData
    if (!data) {
      authError.value = 'Откройте приложение через Telegram'
      return null
    }
    if (authUser.value) return authUser.value

    authLoading.value = true
    authError.value = ''
    try {
      const result = await $fetch<AuthenticatedUser>('/api/auth/telegram', {
        method: 'POST',
        body: { initData: data }
      })
      authUser.value = result
      return result
    } catch {
      authError.value = 'Не удалось авторизоваться через Telegram. Попробуйте ещё раз.'
      return null
    } finally {
      authLoading.value = false
    }
  }

  function requestContact(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!webApp.value?.requestContact) { resolve(null); return }
      webApp.value.requestContact((success, response) => resolve(success ? response?.contact?.phone_number ?? null : null))
    })
  }

  function haptic(): void { webApp.value?.HapticFeedback?.impactOccurred('light') }

  return { webApp, isAvailable, initData, telegramUser, user, isAuthenticated, error, loading, customer, initialize, authenticate, requestContact, haptic }
}
