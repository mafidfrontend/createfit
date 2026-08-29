import { createClient } from '@supabase/supabase-js'

async function generateAndUpload(prompt: string, negativePrompt: string, stabilityApiKey: string, supabase: any): Promise<string> {
  const formData = new FormData()
  formData.append('prompt', prompt)
  formData.append('negative_prompt', negativePrompt) // Nimalar bo'lmasligi kerak
  formData.append('output_format', 'png')
  formData.append('aspect_ratio', '4:5')

  const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stabilityApiKey}`,
      'Accept': 'image/*'
    },
    body: formData
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Stability AI xatoligi: ${errText}`)
  }

  const imageArrayBuffer = await response.arrayBuffer()
  const imageBuffer = Buffer.from(imageArrayBuffer)
  const uniqueFileName = `ai-generated-${Date.now()}.png`

  const { error: uploadError } = await supabase
    .storage
    .from('designs')
    .upload(uniqueFileName, imageBuffer, {
      contentType: 'image/png',
      upsert: false
    })

  if (uploadError) {
    throw new Error(`Supabase yuklash xatosi: ${uploadError.message}`)
  }

  const { data: publicUrlData } = supabase
    .storage
    .from('designs')
    .getPublicUrl(uniqueFileName)

  return publicUrlData.publicUrl
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { productName, fabric, color, style, prompt } = body

    const stabilityApiKey = process.env.STABILITY_API_KEY
    if (!stabilityApiKey) {
      throw createError({ statusCode: 500, message: 'Stability API key topilmadi' })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      throw createError({ statusCode: 500, message: 'Supabase kalitlari topilmadi' })
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })

    // 1. Yangilangan va qat'iy Prompt (Faqat kiyim)
    const finalPrompt = `A single, perfectly isolated ${color} ${productName}, made of ${fabric}. Style: ${style}. The graphic design concept: "${prompt}". Minimalist studio product shot, perfectly centered, pure solid white background. Only the clothing item is visible. Photorealistic, 8k.`
    
    // 2. Nimalar bo'lmasligi kerak (Negative Prompt)
    const negativePrompt = `props, accessories, shoes, sunglasses, hats, extra items, people, flat lay composition, cluttered, multiple objects, messy background, text, watermark`

    // 3. Faqat bitta rasm yaratamiz (bir xillik va tezlik uchun)
    const generatedImageUrl = await generateAndUpload(finalPrompt, negativePrompt, stabilityApiKey, supabase)

    return {
      frontImage: generatedImageUrl,
      backImage: generatedImageUrl
    }

  } catch (error: any) {
    console.error("AI Generation Error:", error)
    throw createError({ statusCode: error.statusCode || 500, message: error.message || 'Dizayn yaratishda xatolik yuz berdi' })
  }
})