export type OrderStatus = 'awaiting_payment' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'awaiting_payment' | 'paid' | 'failed' | 'cancelled'

export interface ApiOrder {
  id: string
  order_number: string
  product: { name: string } | null
  fabric: { name: string } | null
  design: { 
    type: string
    existingDesignName: string | null
    uploadedImageUrl: string | null
    aiPrompt: string | null
    aiFrontImage: string | null
    aiBackImage: string | null
  } | null
  size: string | null
  custom_measurements: Record<string, string> | null
  payment_status: PaymentStatus
  total_price: number
  city: string
  manufacturing_days: number
  created_at: string
}

export interface ApiCreateOrderRequest {
  telegramInitData: string
  contact: {
    name: string
    phone: string
  }
  productId: string
  fabricId: string
  designId: string
  size: string
  delivery: {
    city: string
    address: string
    phone: string
    comment?: string
  }
}

export interface ApiCreateOrderResponse {
  success: boolean
  orderId?: string
  orderNumber?: string
  totalPrice?: number
  paymentStatus?: PaymentStatus
  orderStatus?: OrderStatus
  createdAt?: string
  error?: string
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
  awaiting_payment: 'Ожидает оплаты',
  confirmed: 'В обработке',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
  pending: 'В ожидании',
  paid: 'Оплачен'
}

export function statusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status
}