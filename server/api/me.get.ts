import { createClient } from '@supabase/supabase-js'
import { validateInitData } from '~/server/utils/telegram'

export default defineEventHandler(async (event) => {
  // 1. InitData'ni Query'dan emas, Authorization header'dan olamiz (Frontend shunday yuboryapti)
  const authHeader = getHeader(event, 'authorization')
  let initData = ''
  if (authHeader && authHeader.startsWith('tma ')) {
    initData = authHeader.replace('tma ', '')
  }

  const config = useRuntimeConfig()
  const botToken = config.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN

  let telegramId: string | null = null
  if (initData && botToken) {
    const tgUser = validateInitData(initData, botToken)
    telegramId = tgUser?.id ? String(tgUser.id) : null
  }
  
  if (!telegramId) {
    throw createError({ statusCode: 401, statusMessage: 'Не удалось авторизоваться. Откройте приложение через Telegram.' })
  }

  const supabaseUrl = config.public.supabaseUrl || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Хранилище недоступно' })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  
  // 2. Yangi yaratgan jadvalimizdagi "telegram_user_id" ustuni bo'yicha qidiramiz
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('telegram_user_id', telegramId)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Не удалось загрузить заказы' })
  }

  // 3. Frontend sahifasi xato bermasligi uchun bazadagi ma'lumotlarni u kutayotgan formatga o'g'irib beramiz
  return (data || []).map(row => ({
    id: row.id,
    order_number: row.order_number,
    product: { name: row.product_name },
    fabric: { name: row.fabric_name },
    design: { 
        type: 'existing', 
        existingDesignName: row.design_name, 
        uploadedImageUrl: null, 
        aiPrompt: null, 
        aiFrontImage: null, 
        aiBackImage: null 
    },
    size: row.size,
    custom_measurements: null,
    payment_status: row.payment_status,
    total_price: row.total_price,
    city: row.delivery_city,
    manufacturing_days: row.manufacturing_days,
    created_at: row.created_at
  }))
})