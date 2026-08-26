import type { ApiHealthResponse, ApiOrder, ApiPackage, ApiCreateOrderRequest, ApiCreateOrderResponse } from '~/types/api'

function getBaseUrl(): string {
  const config = useRuntimeConfig()
  const base = (config.public.apiBase as string) || ''
  if (!base) {
    if (import.meta.dev) console.warn('[api] NUXT_PUBLIC_API_BASE is not set')
    return ''
  }
  return base.replace(/\/$/, '')
}

function getAuthHeaders(): Record<string, string> {
  const { getInitData } = useTelegram()
  const initData = getInitData()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (initData) {
    headers['Authorization'] = `tma ${initData}`
  }
  return headers
}

function mapErrorMessage(status: number, fallback: string): string {
  switch (status) {
    case 400: return 'Неверный запрос. Проверьте введённые данные.'
    case 401: return 'Не удалось авторизоваться. Откройте приложение через Telegram.'
    case 403: return 'Доступ запрещён.'
    case 404: return 'Заказ не найден.'
    case 409: return 'Заказ уже существует.'
    case 422: return 'Проверьте корректность введённых данных.'
    case 429: return 'Слишком много запросов. Попробуйте позже.'
    case 500: return 'Сервер временно недоступен. Попробуйте позже.'
    case 502:
    case 503: return 'Сервер временно недоступен. Попробуйте позже.'
    default: return fallback
  }
}

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  idempotencyKey?: string
  query?: Record<string, string>
}

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const base = getBaseUrl()
  if (!base) {
    throw new Error('API не настроен. Обратитесь к администратору.')
  }

  const headers: Record<string, string> = {
    ...getAuthHeaders()
  }
  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey
  }

  try {
    return await $fetch<T>(`${base}${path}`, {
      method: options.method ?? 'GET',
      body: options.body,
      query: options.query,
      headers
    })
  } catch (err: unknown) {
    if (import.meta.dev) console.log(`[api] ${options.method ?? 'GET'} ${path} failed`, err)
    if (err && typeof err === 'object' && 'statusCode' in err) {
      const statusCode = (err as { statusCode: number }).statusCode
      const statusMessage = (err as { statusMessage?: string }).statusMessage
      const message = mapErrorMessage(statusCode, statusMessage ?? 'Произошла ошибка. Попробуйте ещё раз.')
      throw new Error(message)
    }
    if (err instanceof Error) throw err
    throw new Error('Сервер временно недоступен. Попробуйте позже.')
  }
}

export function useApi() {
  return {
    getHealth(): Promise<ApiHealthResponse> {
      return request<ApiHealthResponse>('/api/health')
    },

    getPackages(): Promise<ApiPackage[]> {
      return request<ApiPackage[]>('/api/packages')
    },

    getPackage(id: number): Promise<ApiPackage> {
      return request<ApiPackage>(`/api/packages/${id}`)
    },

    createOrder(data: ApiCreateOrderRequest, idempotencyKey?: string): Promise<ApiCreateOrderResponse> {
      const key = idempotencyKey ?? (import.meta.client ? crypto.randomUUID() : '')
      return request<ApiCreateOrderResponse>('/api/order/create', {
        method: 'POST',
        body: data,
        idempotencyKey: key
      })
    },

    getOrder(id: number): Promise<ApiOrder> {
      return request<ApiOrder>(`/api/orders/${id}`)
    },

    getMyOrders(): Promise<ApiOrder[]> {
      return request<ApiOrder[]>('/api/orders/me')
    }
  }
}
