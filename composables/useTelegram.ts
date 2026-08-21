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
  HapticFeedback?: { impactOccurred: (style: string) => void; notificationOccurred: (type: string) => void }
  colorScheme?: 'light' | 'dark'
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  BackButton?: { show: () => void; hide: () => void; onClick: (cb: () => void) => void; offClick: (cb: () => void) => void }
  MainButton?: { setText: (text: string) => void; show: () => void; hide: () => void; onClick: (cb: () => void) => void; offClick: (cb: () => void) => void }
}

export interface AuthenticatedUser {
  id: number
  firstName: string
  lastName: string
  username: string | null
  languageCode: string | null
  photoUrl: string | null
}

type AuthState = 'idle' | 'authenticating' | 'authenticated' | 'failed'

const webAppInstance = ref<TelegramWebApp | null>(null)
const isReady = ref(false)
let authPromise: Promise<AuthenticatedUser | null> | null = null

export function useTelegram() {
  const authUser = useState<AuthenticatedUser | null>('tg-auth-user', () => null)
  const authError = useState<string>('tg-auth-error', () => '')
  const authState = useState<AuthState>('tg-auth-state', () => 'idle')

  const webApp = computed<TelegramWebApp | undefined>(() => webAppInstance.value ?? undefined)
  const isAvailable = computed(() => Boolean(webAppInstance.value))
  const initData = computed(() => webAppInstance.value?.initData ?? '')
  const telegramUser = computed(() => webAppInstance.value?.initDataUnsafe?.user)
  const user = computed(() => authUser.value)
  const isAuthenticated = computed(() => Boolean(authUser.value))
  const isAuthenticating = computed(() => authState.value === 'authenticating')
  const error = computed(() => authError.value)

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
    if (webAppInstance.value) return
    const wa = window.Telegram?.WebApp
    if (!wa) {
      if (import.meta.dev) console.log('[telegram] WebApp not detected')
      return
    }
    wa.ready?.()
    wa.expand?.()
    wa.setHeaderColor?.('#fff')
    webAppInstance.value = wa
    isReady.value = true
    if (import.meta.dev) console.log('[telegram] initialized, ready:', Boolean(wa.initData))
  }

  function getInitData(): string {
    return webAppInstance.value?.initData ?? ''
  }

  async function authenticate(): Promise<AuthenticatedUser | null> {
    if (authState.value === 'authenticated' && authUser.value) return authUser.value
    if (authPromise) return authPromise

    authPromise = doAuthenticate()
    try {
      return await authPromise
    } finally {
      authPromise = null
    }
  }

  async function doAuthenticate(): Promise<AuthenticatedUser | null> {
    if (!import.meta.client) return null

    if (!webAppInstance.value) initialize()

    const wa = webAppInstance.value
    if (!wa) {
      authState.value = 'failed'
      authError.value = 'Откройте приложение через Telegram'
      if (import.meta.dev) console.log('[telegram] auth failed: WebApp unavailable')
      return null
    }

    const data = wa.initData
    if (!data) {
      authState.value = 'failed'
      authError.value = 'Откройте приложение через Telegram'
      if (import.meta.dev) console.log('[telegram] auth failed: initData missing')
      return null
    }

    authState.value = 'authenticating'
    authError.value = ''
    if (import.meta.dev) console.log('[telegram] authentication started')

    try {
      const result = await $fetch<AuthenticatedUser>('/api/auth/telegram', {
        method: 'POST',
        body: { initData: data }
      })
      authUser.value = result
      authState.value = 'authenticated'
      if (import.meta.dev) console.log('[telegram] authenticated, user id:', result.id)
      return result
    } catch {
      authState.value = 'failed'
      authError.value = 'Не удалось авторизоваться через Telegram. Попробуйте ещё раз.'
      if (import.meta.dev) console.log('[telegram] auth failed: server rejected')
      return null
    }
  }

  function resetAuth(): void {
    authPromise = null
    authState.value = 'idle'
    authUser.value = null
    authError.value = ''
  }

  function requestContact(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!webAppInstance.value?.requestContact) { resolve(null); return }
      webAppInstance.value.requestContact((success, response) => resolve(success ? response?.contact?.phone_number ?? null : null))
    })
  }

  function haptic(): void { webAppInstance.value?.HapticFeedback?.impactOccurred('light') }
  function hapticNotify(type: 'success' | 'warning' | 'error' = 'success'): void {
    webAppInstance.value?.HapticFeedback?.notificationOccurred(type)
  }

  return {
    webApp, isAvailable, initData, telegramUser, user, isAuthenticated, isAuthenticating, isReady,
    error, authState, customer,
    initialize, authenticate, resetAuth, getInitData, requestContact, haptic, hapticNotify
  }
}
