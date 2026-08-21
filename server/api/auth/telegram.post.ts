import { validateInitData, type TelegramUser } from '~/server/utils/telegram'

interface AuthResponse {
  id: number
  firstName: string
  lastName: string
  username: string | null
  languageCode: string | null
  photoUrl: string | null
}

export default defineEventHandler(async (event): Promise<AuthResponse> => {
  const config = useRuntimeConfig()
  const botToken = config.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    throw createError({ statusCode: 500, statusMessage: 'Сервер не настроен для авторизации' })
  }

  const body = await readBody<{ initData?: string }>(event)
  const initData = body?.initData
  if (!initData || typeof initData !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Отсутствуют данные авторизации Telegram' })
  }

  const tgUser: TelegramUser | null = validateInitData(initData, botToken)
  if (!tgUser) {
    throw createError({ statusCode: 401, statusMessage: 'Неверные данные авторизации' })
  }

  return {
    id: tgUser.id,
    firstName: tgUser.first_name ?? '',
    lastName: tgUser.last_name ?? '',
    username: tgUser.username ?? null,
    languageCode: tgUser.language_code ?? null,
    photoUrl: tgUser.photo_url ?? null
  }
})
