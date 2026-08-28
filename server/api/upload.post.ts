import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { fileName, fileType, base64Data } = body

    if (!base64Data) {
      throw createError({ statusCode: 400, message: 'No file data provided' })
    }

    // Base64 dan toza fayl (Buffer) ni ajratib olish
    const base64Cleaned = base64Data.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Cleaned, 'base64')

    // Supabase ga ulanish
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
      throw createError({ statusCode: 500, message: 'Supabase keys missing' })
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    })

    // Bir xil nomli fayllar ustma-ust tushib qolmasligi uchun unikal nom yaratamiz
    const uniqueFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`

    // 1. "designs" nomli papkaga yuklash
    const { error } = await supabase
      .storage
      .from('designs')
      .upload(uniqueFileName, buffer, {
        contentType: fileType,
        upsert: false
      })

    if (error) {
      throw createError({ statusCode: 500, message: error.message })
    }

    // 2. Yuklangan faylning hamma ko'ra oladigan (public) URL manzilini olish
    const { data: publicUrlData } = supabase
      .storage
      .from('designs')
      .getPublicUrl(uniqueFileName)

    // Frontend'ga o'sha manzilni qaytarib beramiz!
    return { url: publicUrlData.publicUrl }

  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message || 'Upload failed' })
  }
})