import { createHmac, timingSafeEqual } from 'node:crypto'

const AUTH_EXPIRY_SECONDS = 86400
const MAX_CLOCK_SKEW_SECONDS = 60

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
    if (!initData || !botToken) return null
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) return null
    params.delete('hash')

    const authDateRaw = params.get('auth_date')
    const authDate = authDateRaw ? parseInt(authDateRaw, 10) : NaN
    if (!Number.isFinite(authDate)) return null
    const now = Math.floor(Date.now() / 1000)
    if (authDate > now + MAX_CLOCK_SKEW_SECONDS || now - authDate > AUTH_EXPIRY_SECONDS) return null

    const pairs: string[] = []
    for (const key of Array.from(params.keys()).sort()) {
      for (const v of params.getAll(key)) {
        pairs.push(`${key}=${v}`)
      }
    }
    const dataCheckString = pairs.join('\n')

    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
    const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
    if (computedHash.length !== hash.length || !timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash.toLowerCase()))) return null

    const userJson = params.get('user')
    if (!userJson) return null
    const tgUser = JSON.parse(userJson) as TelegramUser
    if (!tgUser.id || typeof tgUser.id !== 'number') return null
    return tgUser
  } catch {
    return null
  }
}

export function getTelegramInitData(event: H3Event, bodyInitData = ''): string {
  const authorization = getHeader(event, 'authorization')
  if (authorization?.toLowerCase().startsWith('tma ')) {
    const initData = authorization.slice(4).trim()
    if (initData) return initData
  }

  const headerInitData = getHeader(event, 'x-telegram-init-data')?.trim()
  return headerInitData || bodyInitData.trim()
}

export function requireTelegramUser(event: H3Event, bodyInitData = ''): TelegramUser {
  const config = useRuntimeConfig(event)
  const botToken = config.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || process.env.NUXT_TELEGRAM_BOT_TOKEN
  const initData = getTelegramInitData(event, bodyInitData)
  const user = validateInitData(initData, botToken)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Telegram authentication required' })
  }

  return user
}

// --- YANNGI QO'SHILGAN QISM: Buyurtmani guruhga yuborish ---
// --- TELEGRAM: Buyurtmani guruhga yuborish ---
export async function sendOrderToTelegramGroup(
  orderData: any,
  customerData: {
    name: string
    phone: string
    address: string
  }
) {
  const config = useRuntimeConfig()

  const botToken =
    process.env.TELEGRAM_BOT_TOKEN ||
    config.telegramBotToken

  const chatId =
    process.env.TELEGRAM_CHAT_ID ||
    config.telegramChatId

  if (!botToken || !chatId) {
    console.error(
      'Telegram Bot Token yoki Chat ID sozlanmagan'
    )
    return
  }

  const orderNumber =
    orderData.order_number ||
    orderData.orderNumber ||
    'Новый'

  const product =
    orderData.product?.name ||
    'Одежда'

  const fabric =
    orderData.fabric?.name ||
    'Стандарт'

  const size =
    orderData.size?.standardSize ||
    orderData.size ||
    'Индивидуальный'

  const price =
    orderData.total_price != null
      ? `${orderData.total_price} $`
      : orderData.totalPrice != null
        ? `${orderData.totalPrice} $`
        : 'Договорная'

  // ---------------------------------------------------------
  // DESIGN INFO
  // ---------------------------------------------------------

  let designInfo = 'Стандарт'

  if (
    orderData.design?.type === 'existing'
  ) {
    designInfo =
      `Готовый дизайн: ${orderData.design.existingDesignName ||
      'Без названия'
      }`
  } else if (
    orderData.design?.type === 'ai'
  ) {
    designInfo =
      `AI: ${orderData.design.aiPrompt ||
      orderData.design.prompt ||
      'Сгенерированный дизайн'
      }`
  } else if (
    orderData.design?.type === 'uploaded'
  ) {
    designInfo =
      'Фото от клиента'
  }

  // ---------------------------------------------------------
  // ORDER MESSAGE
  // ---------------------------------------------------------

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
    // -------------------------------------------------------
    // 1. ORDER TEXT
    // -------------------------------------------------------

    await $fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        body: {
          chat_id: chatId,
          text: messageText,
          parse_mode: 'HTML'
        }
      }
    )

    // -------------------------------------------------------
    // 2. GENERATED / UPLOADED IMAGE
    // -------------------------------------------------------

    const imageUrl =
      orderData.design?.aiFrontImage ||
      orderData.design?.imageUrl ||
      orderData.design?.frontImage ||
      orderData.design?.generatedImageUrl ||
      orderData.design?.uploadedImageUrl ||
      orderData.aiFrontImage ||
      orderData.imageUrl ||
      orderData.frontImage

    console.log(
      'Telegram order image URL:',
      imageUrl || 'none'
    )

    if (imageUrl) {
      await $fetch(
        `https://api.telegram.org/bot${botToken}/sendPhoto`,
        {
          method: 'POST',

          body: {
            chat_id: chatId,

            photo: imageUrl,

            caption:
              `🖼 <b>Дизайн для заказа #${orderNumber}</b>`,

            parse_mode: 'HTML'
          }
        }
      )

      console.log(
        'Order design image sent to Telegram'
      )
    } else {
      console.log(
        'Order does not contain a design image'
      )
    }

  } catch (error) {
    console.error(
      'Telegramga xabar yuborishda xato yuz berdi:',
      error
    )
  }
}