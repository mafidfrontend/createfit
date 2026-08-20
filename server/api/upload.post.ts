import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ file: string; mimeType: string; fileName: string }>(event)
  if (!body?.file || !body?.mimeType || !body?.fileName) {
    throw createError({ statusCode: 400, statusMessage: 'Файл не загружен' })
  }
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(body.mimeType)) {
    throw createError({ statusCode: 400, statusMessage: 'Поддерживаются только JPG, PNG и WEBP' })
  }

  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Хранилище недоступно' })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const base64Data = body.file.split(',')[1] ?? body.file
  const buffer = Buffer.from(base64Data, 'base64')
  const ext = body.mimeType === 'image/png' ? 'png' : body.mimeType === 'image/webp' ? 'webp' : 'jpg'
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { data, error } = await supabase.storage
    .from('createfit-designs')
    .upload(path, buffer, { contentType: body.mimeType, upsert: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Не удалось загрузить файл' })
  }

  const { data: urlData } = supabase.storage
    .from('createfit-designs')
    .createSignedUrl((data as { path: string }).path, 3600)

  return { url: urlData?.signedUrl ?? null, path: (data as { path: string }).path }
})
