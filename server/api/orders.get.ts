import { createClient } from '@supabase/supabase-js'
import { validateInitData } from '~/server/utils/telegram'

interface OrderRow {
  id: string
  product: { name: string } | null
  fabric: { name: string } | null
  design: { type: string; existingDesignName: string | null; uploadedImageUrl: string | null; aiPrompt: string | null; aiFrontImage: string | null; aiBackImage: string | null } | null
  size: string | null
  custom_measurements: Record<string, string> | null
  payment_status: string
  total_price: number
  city: string
  manufacturing_days: number
  created_at: string
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const initData = query.initData as string | undefined

  const config = useRuntimeConfig()
  const botToken = config.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN

  let telegramId: number | null = null
  if (initData && botToken) {
    const tgUser = validateInitData(initData, botToken)
    telegramId = tgUser?.id ?? null
  }
  if (!telegramId) {
    throw createError({ statusCode: 401, statusMessage: 'Не удалось определить пользователя Telegram. Откройте приложение через Telegram.' })
  }

  const supabaseUrl = config.public.supabaseUrl || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Хранилище недоступно' })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('telegram_id', telegramId)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Не удалось загрузить заказы' })
  }

  return (data as OrderRow[]) ?? []
})
