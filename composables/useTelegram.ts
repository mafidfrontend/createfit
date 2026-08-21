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

type AuthState = 'idle' | 'initializing' | 'authenticating' | 'authenticated' | 'failed'

export function useTelegram() {
  const authUser = useState<AuthenticatedUser | null>('tg-auth-user', () => null)
  const authError = useState<string>('tg-auth-error', () => '')
  const authState = useState<AuthState>('tg-auth-state', () => 'idle')
  const authAttempted = useState<boolean>('tg-auth-attempted', () => false)

  const webApp = computed<TelegramWebApp | undefined>(() => import.meta.client ? window.Telegram?.WebApp : undefined)
  const isAvailable = computed(() => Boolean(webApp.value))
  const initData = computed(() => webApp.value?.initData ?? '')
  const telegramUser = computed(() => webApp.value?.initDataUnsafe?.user)
  const user = computed(() => authUser.value)
  const isAuthenticated = computed(() => Boolean(authUser.value))
  const error = computed(() => authError.value)
  const loading = computed(() => authState.value === 'authenticating')

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

    if (authState.value === 'authenticated' && authUser.value) return authUser.value
    if (authAttempted.value) return null

    authAttempted.value = true
    authState.value = 'initializing'

    const wa = window.Telegram?.WebApp
    if (!wa) {
      authState.value = 'failed'
      authError.value = 'Откройте приложение через Telegram'
      return null
    }
    wa.ready?.()
    authState.value = 'authenticating'

    const data = wa.initData
    if (!data) {
      authState.value = 'failed'
      authError.value = 'Откройте приложение через Telegram'
      return null
    }

    authError.value = ''
    try {
      const result = await $fetch<AuthenticatedUser>('/api/auth/telegram', {
        method: 'POST',
        body: { initData: data }
      })
      authUser.value = result
      authState.value = 'authenticated'
      return result
    } catch {
      authState.value = 'failed'
      authError.value = 'Не удалось авторизоваться через Telegram. Попробуйте ещё раз.'
      return null
    }
  }

  function resetAuth(): void {
    authAttempted.value = false
    authState.value = 'idle'
    authUser.value = null
    authError.value = ''
  }

  function requestContact(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!webApp.value?.requestContact) { resolve(null); return }
      webApp.value.requestContact((success, response) => resolve(success ? response?.contact?.phone_number ?? null : null))
    })
  }

  function haptic(): void { webApp.value?.HapticFeedback?.impactOccurred('light') }

  return { webApp, isAvailable, initData, telegramUser, user, isAuthenticated, error, loading, authState, customer, initialize, authenticate, resetAuth, requestContact, haptic }
}
