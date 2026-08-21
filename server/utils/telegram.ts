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
