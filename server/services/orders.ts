import { createClient } from '@supabase/supabase-js'
import {
  getActiveDesignBySlug,
  getActiveFabricBySlug,
  getActiveProductBySlug,
  getStoreSettings,
} from './catalog'
import { hashOrderRequest, type OrderRequestFingerprintInput } from './idempotency'
import { calculateOrderPricing, resolveOrderDesign } from './order-pricing'
import { sendOrderNotification, type OrderNotificationData } from './telegram'
import type { TelegramUser } from '../utils/telegram'

export type PaymentStatus = 'pending' | 'awaiting_payment' | 'paid' | 'failed' | 'cancelled'
export type OrderStatus = 'awaiting_payment' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface CreateOrderInput {
  contact: {
    name: string
    phone: string
  }
  productId: string
  fabricId: string
  designId: string
  designType?: string
  designName?: string | null
  aiFrontImage?: string | null
  uploadedImageUrl?: string | null
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
  created?: boolean
  statusCode?: number
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
  idempotency_key?: string | null
  request_hash?: string | null
  product_catalog_id?: string | null
  fabric_catalog_id?: string | null
  design_catalog_id?: string | null
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

function resultFromStoredOrder(order: StoredOrder, created: boolean): CreateOrderResult {
  return {
    success: true,
    orderId: order.id,
    orderNumber: order.order_number,
    totalPrice: Number(order.total_price),
    paymentStatus: order.payment_status,
    orderStatus: order.order_status,
    createdAt: order.created_at,
    created,
  }
}

async function getIdempotentOrder(
  supabase: ReturnType<typeof createClient>,
  telegramUserId: string,
  idempotencyKey: string,
): Promise<{ order: StoredOrder | null; error: string | null }> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('telegram_user_id', telegramUserId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle<StoredOrder>()

  return { order: data ?? null, error: error?.message ?? null }
}

export async function createOrder(
  input: CreateOrderInput,
  telegramUser: TelegramUser,
  idempotencyKey: string,
): Promise<CreateOrderResult> {
  const requestHash = hashOrderRequest(input as OrderRequestFingerprintInput)
  let supabase: ReturnType<typeof createClient>
  try {
    supabase = getSupabaseClient()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: `Database not configured: ${message}`, statusCode: 500 }
  }

  const verifiedTelegramUserId = String(telegramUser.id)
  const existing = await getIdempotentOrder(supabase, verifiedTelegramUserId, idempotencyKey)
  if (existing.error) {
    console.error(`[orders] Idempotency lookup failed: ${existing.error}`)
    return { success: false, error: 'Failed to check order idempotency', statusCode: 500 }
  }
  if (existing.order) {
    if (existing.order.request_hash !== requestHash) {
      return { success: false, error: 'Idempotency-Key was already used for a different request', statusCode: 409 }
    }
    return resultFromStoredOrder(existing.order, false)
  }

  const product = await getActiveProductBySlug(input.productId)
  const fabric = await getActiveFabricBySlug(input.fabricId)
  const predefinedDesign = input.designType === 'existing' ? await getActiveDesignBySlug(input.designId) : null
  const design = resolveOrderDesign(input, predefinedDesign)

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

  // Throws on missing/invalid settings; the settings source of truth is the
  // database, never a hardcoded server or frontend default.
  const settings = await getStoreSettings()
  const { productPrice, fabricPrice, designPrice, deliveryPrice, totalPrice } =
    calculateOrderPricing(product, fabric, design, settings)

  const orderNumber = generateOrderNumber()
  const paymentStatus: PaymentStatus = 'awaiting_payment'
  const orderStatus: OrderStatus = 'awaiting_payment'

  const insertPayload = {
    order_number: orderNumber,
    telegram_user_id: verifiedTelegramUserId,
    telegram_username: telegramUser.username ?? null,
    first_name: telegramUser.first_name ?? '',
    last_name: telegramUser.last_name ?? null,
    phone: input.contact.phone,
    product_id: product.slug,
    product_name: product.name,
    product_catalog_id: product.id,
    fabric_id: fabric.slug,
    fabric_name: fabric.name,
    fabric_catalog_id: fabric.id,
    design_id: design.slug,
    design_name: design.name,
    design_catalog_id: design.catalogId,
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
    manufacturing_days: settings.manufacturing_days,
    idempotency_key: idempotencyKey,
    request_hash: requestHash,
  }

  const { data, error } = await supabase
    .from('orders')
    .insert(insertPayload)
    .select()
    .single<StoredOrder>()

  if (error?.code === '23505') {
    const concurrent = await getIdempotentOrder(supabase, verifiedTelegramUserId, idempotencyKey)
    if (concurrent.error) {
      console.error(`[orders] Idempotency recovery lookup failed: ${concurrent.error}`)
      return { success: false, error: 'Failed to recover idempotent order', statusCode: 500 }
    }
    if (concurrent.order) {
      if (concurrent.order.request_hash !== requestHash) {
        return { success: false, error: 'Idempotency-Key was already used for a different request', statusCode: 409 }
      }
      return resultFromStoredOrder(concurrent.order, false)
    }
  }

  if (error || !data) {
    const message = error?.message ?? 'Unknown database error'
    console.error(`[orders] Insert failed: ${message}`)
    return { success: false, error: `Failed to store order: ${message}`, statusCode: 500 }
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

  return resultFromStoredOrder(data, true)
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
