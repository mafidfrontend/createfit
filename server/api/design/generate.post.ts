import { createClient } from '@supabase/supabase-js'

async function generateAndUpload(prompt: string, negativePrompt: string, stabilityApiKey: string, supabase: any): Promise<string> {
  const formData = new FormData()
  formData.append('prompt', prompt)
  formData.append('negative_prompt', negativePrompt)
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
    throw new Error(`Stability xatosi: ${errText}`)
  }

  const imageArrayBuffer = await response.arrayBuffer()
  const imageBuffer = Buffer.from(imageArrayBuffer)
  const uniqueFileName = `ai-generated-${Date.now()}.png`

  const { error: uploadError } = await supabase.storage.from('designs').upload(uniqueFileName, imageBuffer, {
    contentType: 'image/png',
    upsert: false
  })

  if (uploadError) throw new Error(`Supabase xatosi: ${uploadError.message}`)

  const { data: publicUrlData } = supabase.storage.from('designs').getPublicUrl(uniqueFileName)
  return publicUrlData.publicUrl
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { productName, fabric, color, style, prompt, uploadedImageUrl } = body

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) throw createError({ statusCode: 500, message: 'Supabase kalitlari yoq' })

    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    // --- GEMINI TARJIMA QISMI ---
    let englishDesignDescription = `${color} ${productName}, made of ${fabric}. Style: ${style}. Concept: ${prompt}`
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
    
    if (geminiApiKey) {
      try {
        let geminiInstruction = `Act as an expert AI prompt engineer. Translate and enhance the user's Russian clothing design description into a highly detailed English prompt for Stable Diffusion. 
        IMPORTANT RULE: If the user explicitly mentions colors or patterns in their description (like "адрас", "красно-розовых"), you MUST prioritize those over the default color (${color}) and style (${style}). 
        Translate "адрас" or "икат" as "traditional Central Asian ikat/adras pattern".
        
        User description: ${prompt}.
        Return ONLY the enhanced English description, nothing else.`

        const parts: any[] = []

        if (uploadedImageUrl) {
          const imgRes = await fetch(uploadedImageUrl)
          const arrayBuffer = await imgRes.arrayBuffer()
          const base64 = Buffer.from(arrayBuffer).toString('base64')
          const mimeType = imgRes.headers.get('content-type') || 'image/jpeg'

          geminiInstruction += `\n\nThe user also provided a reference image (logo). Combine the visual details of the reference image with the text prompt seamlessly.`
          parts.push({ inlineData: { data: base64, mimeType: mimeType } })
        }

        parts.unshift({ text: geminiInstruction })
        const geminiRes = await $fetch<any>(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          body: { contents: [{ parts: parts }], generationConfig: { temperature: 0.3 } }
        })
        const translatedText = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text
        if (translatedText) englishDesignDescription = translatedText.trim()
      } catch (e) {
        console.error('Gemini xatosi:', e)
      }
    }
    // ------------------------------------

    const finalPrompt = `A high-quality, split-view professional apparel mockup showing two sides of a single ${productName} side-by-side. Left side is front view, right side is back view. ${englishDesignDescription}. Minimalist studio product shot, perfectly centered, pure solid white background. Photorealistic, highly detailed, 8k resolution, no models, no humans.`
    const negativePrompt = `human, people, model, wearing, single view, only one side, folded, distorted proportions, props, accessories, shoes, messy background`

    // --- BARCHA KALITLARNI KETMA-KET TEKSHIRISH (LOOP) ---
    const keysEnv = process.env.STABILITY_API_KEYS || process.env.STABILITY_API_KEY || ''
    const stabilityKeys = keysEnv.split(',').map(k => k.trim()).filter(Boolean)
    
    if (stabilityKeys.length === 0) throw new Error('Stability kalitlari topilmadi')

    let generatedImageUrl = ''
    let lastError = null

    // Tsikl barcha kalitlarni aylanib chiqadi
    for (const key of stabilityKeys) {
      try {
        console.log("Shu kalit tekshirilmoqda:", key.substring(0, 8) + "...")
        generatedImageUrl = await generateAndUpload(finalPrompt, negativePrompt, key, supabase)
        break; // Agar rasm muvaffaqiyatli yasalsa, tsiklni to'xtatadi
      } catch (err: any) {
        console.warn(`Kalit ishlamadi, keyingisiga o'tilmoqda: ${err.message}`)
        lastError = err // Xatoni eslab qoladi va keyingi kalitga o'tadi
      }
    }

    // Agar 4 ta kalit ham ishlamasa, keyin xato beradi
    if (!generatedImageUrl) {
      throw createError({ statusCode: 500, message: `Barcha Stability kalitlari ishlamadi (Kredit tugagan bo'lishi mumkin): ${lastError?.message}` })
    }

    return { frontImage: generatedImageUrl }

  } catch (error: any) {
    console.error("AI Generation Error:", error)
    throw createError({ statusCode: error.statusCode || 500, message: error.message || 'Dizayn yaratishda xatolik' })
  }
})