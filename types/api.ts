export interface ApiPackage {
  id: number
  title: string
  type: string
  emoji?: string
  price: number
  description?: string
}

export interface ApiOrderPackage {
  id: number
  title: string
  type: string
  emoji?: string
  price: number
}

export type OrderStatus = 'pending' | 'processing' | 'paid' | 'completed' | 'cancelled' | 'rejected'

export interface ApiOrder {
  id: number
  status: OrderStatus
  package: ApiOrderPackage
  comment?: string
  payment_method?: string
  created_at: string
  updated_at?: string
}

export interface ApiCreateOrderRequest {
  package_id: number
  comment?: string
  payment_method?: string
}

export interface ApiCreateOrderResponse {
  success: boolean
  order: ApiOrder
}

export interface ApiHealthResponse {
  status: 'ok' | 'error'
  database?: 'connected' | 'disconnected'
}

export interface ApiError {
  statusCode: number
  statusMessage: string
  message?: string
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Заказ принят',
  processing: 'В работе',
  paid: 'Оплачен',
  completed: 'Завершён',
  cancelled: 'Отменён',
  rejected: 'Отклонён'
}

export function statusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status
}
