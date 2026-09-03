import { createHmac, timingSafeEqual } from 'node:crypto'

const AUTH_EXPIRY_SECONDS = 86400

export interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

export function validateInitData(initData: string, botToken: string): TelegramUser | null {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return null
    params.delete('hash')

    const authDateRaw = params.get('auth_date')
    const authDate = authDateRaw ? parseInt(authDateRaw, 10) : NaN
    if (!Number.isFinite(authDate)) return null
    if (Math.floor(Date.now() / 1000) - authDate > AUTH_EXPIRY_SECONDS) return null

    const pairs: string[] = []
    for (const key of Array.from(params.keys()).sort()) {
      for (const v of params.getAll(key)) {
        pairs.push(`${key}=${v}`)
      }
    }
    const dataCheckString = pairs.join('\n')

    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
    const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
    if (computedHash.length !== hash.length || !timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash))) return null

    const userJson = params.get('user')
    if (!userJson) return null
    const tgUser = JSON.parse(userJson) as TelegramUser
    if (!tgUser.id || typeof tgUser.id !== 'number') return null
    return tgUser
  } catch {
    return null
  }
}

// --- YANNGI QO'SHILGAN QISM: Buyurtmani guruhga yuborish ---
export async function sendOrderToTelegramGroup(orderData: any, customerData: { name: string, phone: string, address: string }) {
  const config = useRuntimeConfig()
  const botToken = process.env.TELEGRAM_BOT_TOKEN || config.telegramBotToken
  const chatId = process.env.TELEGRAM_CHAT_ID || config.telegramChatId

  if (!botToken || !chatId) {
    console.error('Telegram Bot Token yoki Chat ID sozlanmagan')
    return
  }

  const orderNumber = orderData.order_number || 'Новый'
  const product = orderData.product?.name || 'Одежда'
  const fabric = orderData.fabric?.name || 'Стандарт'
  const size = orderData.size?.standardSize || orderData.size || 'Индивидуальный'
  const price = orderData.total_price ? `${orderData.total_price} $` : 'Договорная'
  
  let designInfo = 'Стандарт'
  if (orderData.design?.type === 'existing') designInfo = `Готовый дизайн: ${orderData.design.existingDesignName}`
  else if (orderData.design?.type === 'ai') designInfo = `AI: ${orderData.design.aiPrompt}`
  else if (orderData.design?.type === 'uploaded') designInfo = 'Фото от клиента'

  const messageText = `
🛍 <b>НОВЫЙ ЗАКАЗ #${orderNumber}</b>

👤 <b>Имя:</b> ${customerData.name}
📞 <b>Телефон:</b> ${customerData.phone}
📍 <b>Адрес:</b> ${customerData.address}

📦 <b>Детали заказа:</b>
• <b>Изделие:</b> ${product}
• <b>Ткань:</b> ${fabric}
• <b>Размер:</b> ${size}
• <b>Дизайн:</b> ${designInfo}
💵 <b>Итого:</b> ${price}
`

  try {
    await $fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      body: {
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML'
      }
    })

    const imageUrl = orderData.design?.aiFrontImage || orderData.design?.uploadedImageUrl
    if (imageUrl) {
      await $fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        body: {
          chat_id: chatId,
          photo: imageUrl,
          caption: `🖼 <b>Дизайн для заказа #${orderNumber}</b>`,
          parse_mode: 'HTML'
        }
      })
    }
  } catch (error) {
    console.error('Telegramga xabar yuborishda xato yuz berdi:', error)
  }
}