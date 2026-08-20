import { createClient } from '@supabase/supabase-js'
import { FABRICS, PRODUCTS, DELIVERY_PRICE, MANUFACTURING_DAYS } from '~/config/catalog'
import { calculateSubtotal, calculateTotal } from '~/utils/pricing'
import type { OrderDraft, PaymentMethod } from '~/types/order'

export function validateDraft(input: unknown): OrderDraft {
  const draft = input as Partial<OrderDraft>
  if (typeof draft.customer?.telegramId !== 'number' || draft.customer.telegramId < 0 || !draft.customer.phone) throw createError({ statusCode: 400, statusMessage: 'Нужны Telegram ID и номер телефона' })
  const product = PRODUCTS.find((item) => item.id === draft.product?.id)
  const fabric = FABRICS.find((item) => item.id === draft.fabric?.id)
  if (!product) throw createError({ statusCode: 400, statusMessage: 'Выберите изделие' })
  if (!fabric) throw createError({ statusCode: 400, statusMessage: 'Выберите ткань' })
  if (!draft.design || !draft.size) throw createError({ statusCode: 400, statusMessage: 'Заполните дизайн и размер' })
  if (!draft.delivery?.city?.trim() || !draft.delivery.address?.trim()) throw createError({ statusCode: 400, statusMessage: 'Введите город и адрес доставки' })
  const subtotal = calculateSubtotal(product, fabric, draft.design.additionalPrice)
  return { ...draft, product, fabric, subtotal, deliveryPrice: DELIVERY_PRICE, totalPrice: calculateTotal(product, fabric, draft.design.additionalPrice, DELIVERY_PRICE), manufacturingDays: MANUFACTURING_DAYS, paymentStatus: 'pending', paymentMethod: null, delivery: { ...draft.delivery, price: DELIVERY_PRICE } } as OrderDraft
}

export async function saveOrder(order: OrderDraft, id: string, createdAt: string): Promise<void> {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { error } = await supabase.from('orders').insert({
    id,
    telegram_id: order.customer.telegramId,
    first_name: order.customer.firstName,
    last_name: order.customer.lastName,
    username: order.customer.username,
    phone: order.customer.phone,
    product: order.product,
    fabric: order.fabric,
    design: order.design,
    size: order.size?.type === 'custom' ? 'Индивидуальный' : order.size?.standardSize,
    custom_measurements: order.size?.customMeasurements,
    payment_method: order.paymentMethod as PaymentMethod | null,
    payment_status: order.paymentStatus,
    subtotal: order.subtotal,
    delivery_price: order.deliveryPrice,
    total_price: order.totalPrice,
    city: order.delivery.city,
    address: order.delivery.address,
    comment: order.delivery.comment,
    manufacturing_days: order.manufacturingDays,
    created_at: createdAt
  })
  if (error) throw createError({ statusCode: 500, statusMessage: 'Не удалось сохранить заказ' })
}

export async function notifyAdmin(order: OrderDraft, id: string, createdAt: string): Promise<void> {
  const config = useRuntimeConfig()
  const botToken = config.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN
  const adminChatId = config.telegramAdminChatId || process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!botToken || !adminChatId) return
  const username = order.customer.username ? `@${order.customer.username}` : 'не указан'
  const measurements = order.size?.customMeasurements
  const designLabel = order.design?.type === 'ai' ? `AI: ${order.design.aiPrompt ?? ''}` : order.design?.type === 'uploaded' ? 'Загруженный дизайн' : order.design?.existingDesignName
  const text = [
    `НОВЫЙ ЗАКАЗ`,
    `Заказ: #${id}`,
    '',
    `КЛИЕНТ`,
    `Имя: ${order.customer.firstName || 'не указано'}`,
    `Фамилия: ${order.customer.lastName || 'не указана'}`,
    `Телефон: ${order.customer.phone}`,
    `Telegram: ${username}`,
    `Telegram ID: ${order.customer.telegramId}`,
    '',
    `ИЗДЕЛИЕ`,
    `Изделие: ${order.product?.name}`,
    `Ткань: ${order.fabric?.name}`,
    `Дизайн: ${designLabel}`,
    `Размер: ${order.size?.type === 'custom' ? 'Индивидуальный' : order.size?.standardSize}`,
    ...(measurements ? [`Рост: ${measurements.height}`, `Грудь: ${measurements.chest}`, `Талия: ${measurements.waist}`, `Бёдра: ${measurements.hips}`] : []),
    '',
    `ЗАКАЗ`,
    `Изделие: ${order.product?.basePrice}`,
    `Ткань: +${order.fabric?.additionalPrice}`,
    `Доставка: ${order.deliveryPrice}`,
    `ИТОГО: ${order.totalPrice}`,
    `Статус: Заказ принят`,
    '',
    `ДОСТАВКА`,
    `Город: ${order.delivery.city}`,
    `Адрес: ${order.delivery.address}`,
    `Срок изготовления: 7 дней`,
    `Дата: ${new Date(createdAt).toLocaleString('ru-RU')}`
  ].join('\n')
  await $fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, { method: 'POST', body: { chat_id: adminChatId, text } })
}
