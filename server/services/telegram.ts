interface TelegramConfig {
  botToken: string
  adminChatId: string
}

function getTelegramConfig(): TelegramConfig {
  const config = useRuntimeConfig()
  const botToken = config.telegramBotToken as string
  const adminChatId = config.telegramAdminChatId as string

  if (!botToken || !adminChatId) {
    throw new Error('Telegram bot token or admin chat ID is not configured')
  }

  return { botToken, adminChatId }
}

function formatPriceUSD(price: number): string {
  if (Number.isInteger(price)) {
    return `$${price}`
  }
  return `$${price.toFixed(2)}`
}

function formatOrderDate(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}.${month}.${year} ${hours}:${minutes}`
}

export interface OrderNotificationData {
  orderNumber: string
  telegramUserId: string
  telegramUsername: string | null
  firstName: string
  lastName: string | null
  phone: string
  productName: string
  fabricName: string
  designName: string
  size: string
  productPrice: number
  fabricPrice: number
  designPrice: number
  deliveryPrice: number
  total: number
  paymentStatus: string
  createdAt: string
  manufacturingDays: number
}

export function buildOrderMessage(data: OrderNotificationData): string {
  const usernameDisplay = data.telegramUsername
    ? `@${data.telegramUsername}`
    : 'Не указан'

  const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ')

  return [
    '🛍 НОВЫЙ ЗАКАЗ',
    '',
    `🧾 Заказ: #${data.orderNumber}`,
    '',
    '👤 Клиент:',
    `Имя: ${fullName}`,
    `📱 Телефон: ${data.phone}`,
    `🔗 Username: ${usernameDisplay}`,
    `🆔 Telegram ID: ${data.telegramUserId}`,
    '',
    '📦 Заказ:',
    `Изделие: ${data.productName}`,
    `Ткань: ${data.fabricName}`,
    `Дизайн: ${data.designName}`,
    `Размер: ${data.size}`,
    '',
    '💵 Стоимость:',
    `Изделие: ${formatPriceUSD(data.productPrice)}`,
    `Ткань: ${formatPriceUSD(data.fabricPrice)}`,
    `Дизайн: ${formatPriceUSD(data.designPrice)}`,
    `Доставка: ${formatPriceUSD(data.deliveryPrice)}`,
    '',
    `💰 Итого: ${formatPriceUSD(data.total)}`,
    '',
    `💳 Оплата: ${data.paymentStatus}`,
    '',
    '📅 Дата заказа:',
    formatOrderDate(data.createdAt),
    '',
    `⏱ Срок изготовления: ${data.manufacturingDays} дней`,
  ].join('\n')
}

export async function sendOrderNotification(data: OrderNotificationData): Promise<boolean> {
  try {
    const { botToken, adminChatId } = getTelegramConfig()
    const text = buildOrderMessage(data)

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminChatId,
        text,
        parse_mode: 'HTML',
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'unknown')
      console.error(`[telegram] Notification failed: ${response.status} ${response.statusText} — ${errorBody}`)
      return false
    }

    console.log(`[telegram] Order notification sent for #${data.orderNumber}`)
    return true
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[telegram] Notification error: ${message}`)
    return false
  }
}
