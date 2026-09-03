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

  const orderNumber = orderData.order_number || 'Yangi'
  const product = orderData.product?.name || 'Kiyim'
  const fabric = orderData.fabric?.name || 'Standart'
  const size = orderData.size?.standardSize || orderData.size || 'Maxsus'
  const price = orderData.total_price ? `${orderData.total_price} $` : 'Kelishilgan'
  
  let designInfo = 'Standart'
  if (orderData.design?.type === 'existing') designInfo = `Tayyor dizayn: ${orderData.design.existingDesignName}`
  else if (orderData.design?.type === 'ai') designInfo = `AI: ${orderData.design.aiPrompt}`
  else if (orderData.design?.type === 'uploaded') designInfo = 'Mijoz rasmi yuklangan'

  const messageText = `
🛍 <b>YANGI BUYURTMA #${orderNumber}</b>

👤 <b>Ismi:</b> ${customerData.name}
📞 <b>Telefon raqami:</b> ${customerData.phone}
📍 <b>Manzil:</b> ${customerData.address}

📦 <b>Buyurtma ma'lumoti:</b>
• <b>Kiyim:</b> ${product}
• <b>Mato:</b> ${fabric}
• <b>O'lcham:</b> ${size}
• <b>Dizayn:</b> ${designInfo}
💵 <b>Jami summa:</b> ${price}
`

  try {
    // 1. Matnli xabarni yuborish
    await $fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      body: {
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML'
      }
    })

    // 2. Agar dizayn rasmi mavjud bo'lsa, uni ham yuborish
    const imageUrl = orderData.design?.aiFrontImage || orderData.design?.uploadedImageUrl
    if (imageUrl) {
      await $fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        body: {
          chat_id: chatId,
          photo: imageUrl,
          caption: `🖼 <b>#${orderNumber}</b> dizayn rasmi`,
          parse_mode: 'HTML'
        }
      })
    }
    } catch (error: any) {
    // Xatoni aniq ko'rsatish uchun error.data ni log qilamiz
    console.error('Telegramga xabar yuborishda xato yuz berdi:', error.data || error.message)
  }
}