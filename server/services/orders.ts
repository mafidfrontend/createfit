import { createClient } from '@supabase/supabase-js'
import {
  getServerProduct,
  getServerFabric,
  getServerDesign,
  calculateServerTotal,
  SERVER_DELIVERY_PRICE,
  SERVER_MANUFACTURING_DAYS,
} from '../config/catalog'
import { sendOrderNotification, type OrderNotificationData } from './telegram'

export type PaymentStatus = 'pending' | 'awaiting_payment' | 'paid' | 'failed' | 'cancelled'
export type OrderStatus = 'awaiting_payment' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface CreateOrderInput {
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
    comment: string
  }
}

export interface CreateOrderResult {
  success: boolean
  orderId?: string
  orderNumber?: string
  totalPrice?: number
  paymentStatus?: PaymentStatus
  orderStatus?: OrderStatus
  createdAt?: string
  error?: string
}

export interface StoredOrder {
  id: string
  order_number: string
  telegram_user_id: string
  telegram_username: string | null
  first_name: string
  last_name: string | null
  phone: string
  product_id: string
  product_name: string
  fabric_id: string
  fabric_name: string
  design_id: string
  design_name: string
  size: string
  delivery_city: string
  delivery_address: string
  delivery_phone: string
  delivery_comment: string | null
  product_price: number
  fabric_price: number
  design_price: number
  delivery_price: number
  total_price: number
  payment_status: PaymentStatus
  order_status: OrderStatus
  manufacturing_days: number
  created_at: string
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}

export function generateOrderNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'CF-'
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export function parseTelegramUser(initData: string): {
  telegramUserId: string
  telegramUsername: string | null
  firstName: string
  lastName: string | null
} | null {
  try {
    const params = new URLSearchParams(initData)
    const userJson = params.get('user')
    if (!userJson) return null

    const user = JSON.parse(userJson) as {
      id: number
      username?: string
      first_name?: string
      last_name?: string
    }

    if (!user.id) return null

    return {
      telegramUserId: String(user.id),
      telegramUsername: user.username ?? null,
      firstName: user.first_name ?? '',
      lastName: user.last_name ?? null,
    }
  } catch {
    return null
  }
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const product = getServerProduct(input.productId)
  const fabric = getServerFabric(input.fabricId)
  const design = getServerDesign(input.designId)

  if (!product) {
    return { success: false, error: `Invalid product: ${input.productId}` }
  }
  if (!fabric) {
    return { success: false, error: `Invalid fabric: ${input.fabricId}` }
  }
  if (!design) {
    return { success: false, error: `Invalid design: ${input.designId}` }
  }

  const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  if (!validSizes.includes(input.size)) {
    return { success: false, error: `Invalid size: ${input.size}` }
  }

  if (!input.contact.name.trim() || !input.contact.phone.trim()) {
    return { success: false, error: 'Contact name and phone are required' }
  }

  if (!input.delivery.city.trim() || !input.delivery.address.trim() || !input.delivery.phone.trim()) {
    return { success: false, error: 'Delivery city, address, and phone are required' }
  }

  const telegramUser = parseTelegramUser(input.telegramInitData)
  if (!telegramUser || !telegramUser.telegramUserId) {
    return { success: false, error: 'Unable to identify Telegram user' }
  }

  const productPrice = product.price
  const fabricPrice = fabric.price
  const designPrice = design.price
  const deliveryPrice = SERVER_DELIVERY_PRICE
  const totalPrice = calculateServerTotal(productPrice, fabricPrice, designPrice, deliveryPrice)

  const orderNumber = generateOrderNumber()
  const paymentStatus: PaymentStatus = 'awaiting_payment'
  const orderStatus: OrderStatus = 'awaiting_payment'

  const insertPayload = {
    order_number: orderNumber,
    telegram_user_id: telegramUser.telegramUserId,
    telegram_username: telegramUser.telegramUsername,
    first_name: input.contact.name,
    last_name: null,
    phone: input.contact.phone,
    product_id: product.id,
    product_name: product.name,
    fabric_id: fabric.id,
    fabric_name: fabric.name,
    design_id: design.id,
    design_name: design.name,
    size: input.size,
    delivery_city: input.delivery.city,
    delivery_address: input.delivery.address,
    delivery_phone: input.delivery.phone,
    delivery_comment: input.delivery.comment || null,
    product_price: productPrice,
    fabric_price: fabricPrice,
    design_price: designPrice,
    delivery_price: deliveryPrice,
    total_price: totalPrice,
    payment_status: paymentStatus,
    order_status: orderStatus,
    manufacturing_days: SERVER_MANUFACTURING_DAYS,
  }

  let supabase: ReturnType<typeof createClient>
  try {
    supabase = getSupabaseClient()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: `Database not configured: ${message}` }
  }

  const { data, error } = await supabase
    .from('orders')
    .insert(insertPayload)
    .select()
    .single<StoredOrder>()

  if (error || !data) {
    const message = error?.message ?? 'Unknown database error'
    console.error(`[orders] Insert failed: ${message}`)
    return { success: false, error: `Failed to store order: ${message}` }
  }

  const notificationData: OrderNotificationData = {
    orderNumber: data.order_number,
    telegramUserId: data.telegram_user_id,
    telegramUsername: data.telegram_username,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone,
    productName: data.product_name,
    fabricName: data.fabric_name,
    designName: data.design_name,
    size: data.size,
    productPrice: Number(data.product_price),
    fabricPrice: Number(data.fabric_price),
    designPrice: Number(data.design_price),
    deliveryPrice: Number(data.delivery_price),
    total: Number(data.total_price),
    paymentStatus: data.payment_status,
    createdAt: data.created_at,
    manufacturingDays: data.manufacturing_days,
  }

  await sendOrderNotification(notificationData)

  return {
    success: true,
    orderId: data.id,
    orderNumber: data.order_number,
    totalPrice: Number(data.total_price),
    paymentStatus: data.payment_status,
    orderStatus: data.order_status,
    createdAt: data.created_at,
  }
}

export async function getOrderByNumber(orderNumber: string): Promise<StoredOrder | null> {
  let supabase: ReturnType<typeof createClient>
  try {
    supabase = getSupabaseClient()
  } catch {
    return null
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .maybeSingle<StoredOrder>()

  if (error || !data) {
    return null
  }

  return data
}
