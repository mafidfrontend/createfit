import { createClient } from '@supabase/supabase-js'

interface OrderRow {
  id: string
  telegram_id: number
  first_name: string
  last_name: string
  username: string | null
  phone: string
  product: { id: string; name: string; basePrice: number; description: string }
  fabric: { id: string; name: string; additionalPrice: number; description: string }
  design: { type: string; existingDesignId: string | null; existingDesignName: string | null; uploadedImageUrl: string | null; uploadedImageName: string | null; additionalPrice: number }
  size: string | null
  custom_measurements: Record<string, string> | null
  payment_method: string
  payment_status: string
  subtotal: number
  delivery_price: number
  total_price: number
  city: string
  address: string
  comment: string
  manufacturing_days: number
  created_at: string
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const telegramId = Number(query.telegram_id)
  if (!Number.isInteger(telegramId) || telegramId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Не удалось определить пользователя Telegram' })
  }

  const config = useRuntimeConfig()
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
