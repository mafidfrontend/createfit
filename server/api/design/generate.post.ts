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

// ===== GEMINI QAYTA URINISH (RETRY) FUNKSIYASI =====
async function callGeminiWithRetry(
  geminiApiKey: string, 
  parts: any[], 
  maxRetries: number = 3
): Promise<any> {
  // API kaliti mavjudligini tekshirish (Xavfsizlik tekshiruvi)
  if (!geminiApiKey) {
    throw new Error('Gemini API kaliti topilmadi')
  }

  // Kalit formatini tekshirish (taxminiy tekshiruv)
  if (!geminiApiKey.startsWith('AI') && geminiApiKey.length < 30) {
    console.warn('Gemini API kaliti formati shubhali, davom etilmoqda...')
  }

  let lastError = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Gemini so'rovi: urinish ${attempt}/${maxRetries}`)
      
      const response = await $fetch<any>(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: { 
            contents: [{ parts: parts }], 
            generationConfig: { 
              temperature: 0.3,
              maxOutputTokens: 500
            } 
          }
        }
      )

      // Javobni tekshirish
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('Gemini dan hech qanday javob kelmadi')
      }

      const text = response.candidates[0]?.content?.parts?.[0]?.text
      if (!text) {
        throw new Error('Gemini dan bo\'sh javob keldi')
      }

      console.log(`Gemini muvaffaqiyatli: ${text.substring(0, 50)}...`)
      return response

    } catch (error: any) {
      lastError = error
      
      // Xato turini aniqlash
      const errorMessage = error.message || ''
      const isRateLimit = errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')
      const isServerError = errorMessage.includes('503') || errorMessage.includes('500') || errorMessage.includes('502')
      const isAuthError = errorMessage.includes('403') || errorMessage.includes('401') || errorMessage.includes('API key')
      
      if (isAuthError) {
        console.error('Gemini autentifikatsiya xatosi: API kaliti noto\'g\'ri yoki muddati o\'tgan')
        throw new Error(`Gemini autentifikatsiya xatosi: ${errorMessage}`)
      }
      
      if (attempt === maxRetries) {
        console.error(`Gemini ${maxRetries} marta urinishdan keyin ham ishlamadi`)
        break
      }

      // Eksponensial kutish vaqti
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 8000)
      
      if (isRateLimit) {
        console.warn(`Gemini rate limit: ${waitTime}ms kutish...`)
      } else if (isServerError) {
        console.warn(`Gemini server xatosi: ${waitTime}ms kutish...`)
      } else {
        console.warn(`Gemini xatosi (${errorMessage}): ${waitTime}ms kutish...`)
      }
      
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  // Barcha urinishlar muvaffaqiyatsiz bo'lsa
  throw new Error(`Gemini ${maxRetries} ta urinishdan keyin ishlamadi: ${lastError?.message || 'Noma\'lum xato'}`)
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { productName, fabric, color, style, prompt, uploadedImageUrl } = body

    // ===== SUPABASE KONFIGURATSIYASI (Xavfsizlik tekshiruvi) =====
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      throw createError({ 
        statusCode: 500, 
        message: 'Supabase kalitlari topilmadi. Iltimos, SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY ni tekshiring.' 
      })
    }

    // Supabase URL formatini tekshirish
    if (!supabaseUrl.startsWith('https://')) {
      console.warn('Supabase URL https:// bilan boshlanishi kerak')
    }

    const supabase = createClient(supabaseUrl, serviceKey, { 
      auth: { persistSession: false } 
    })

    // ===== GEMINI TARJIMA QISMI (Xavfsizlik + Retry bilan) =====
    let englishDesignDescription = `${color} ${productName}, made of ${fabric}. Style: ${style}. Concept: ${prompt}`
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
    
    // Gemini API kaliti mavjudligini tekshirish (Xavfsizlik tekshiruvi)
    if (geminiApiKey) {
      try {
        // Gemini uchun instruktsiya tayyorlash
        let geminiInstruction = `Act as an expert AI prompt engineer. Translate and enhance the user's Russian clothing design description into a highly detailed English prompt for Stable Diffusion. 
        IMPORTANT RULE: If the user explicitly mentions colors or patterns in their description (like "адрас", "красно-розовых"), you MUST prioritize those over the default color (${color}) and style (${style}). 
        Translate "адрас" or "икат" as "traditional Central Asian ikat/adras pattern".
        
        User description: ${prompt}.
        Return ONLY the enhanced English description, nothing else.`

        const parts: any[] = []

        // Rasm mavjud bo'lsa, uni Base64 ga o'tkazish
        if (uploadedImageUrl) {
          try {
            const imgRes = await fetch(uploadedImageUrl)
            if (!imgRes.ok) {
              console.warn(`Rasmni yuklab olish mumkin emas: ${imgRes.status}`)
            } else {
              const arrayBuffer = await imgRes.arrayBuffer()
              const base64 = Buffer.from(arrayBuffer).toString('base64')
              const mimeType = imgRes.headers.get('content-type') || 'image/jpeg'

              geminiInstruction += `\n\nThe user also provided a reference image (logo). Combine the visual details of the reference image with the text prompt seamlessly.`
              parts.push({ inlineData: { data: base64, mimeType: mimeType } })
            }
          } catch (imgError) {
            console.warn('Rasmni yuklab olishda xatolik, matn bilan davom etilmoqda:', imgError)
          }
        }

        parts.unshift({ text: geminiInstruction })
        
        // ===== GEMINI QAYTA URINISH BILAN CHAQIRISH =====
        const geminiRes = await callGeminiWithRetry(geminiApiKey, parts, 3)
        
        const translatedText = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text
        if (translatedText && translatedText.trim().length > 0) {
          englishDesignDescription = translatedText.trim()
          console.log('Gemini tarjimasi muvaffaqiyatli')
        } else {
          console.warn('Gemini dan bo\'sh javob, default description ishlatiladi')
        }
        
      } catch (geminiError: any) {
        // Gemini ishlamasa, default description ishlatiladi (xatolik log qilinadi)
        console.error('Gemini xatosi (default description ishlatiladi):', geminiError.message)
        
        // Agar Gemini butunlay ishlamasa, lekin bu kritik emas - davom etamiz
        // Chunki bizda default description bor
      }
    } else {
      console.warn('Gemini API kaliti topilmadi, default description ishlatiladi')
    }

    // ===== STABLE DIFFUSION PROMPT =====
    const finalPrompt = `A high-quality, split-view professional apparel mockup showing two sides of a single ${productName} side-by-side. Left side is front view, right side is back view. ${englishDesignDescription}. Minimalist studio product shot, perfectly centered, pure solid white background. Photorealistic, highly detailed, 8k resolution, no models, no humans.`
    const negativePrompt = `human, people, model, wearing, single view, only one side, folded, distorted proportions, props, accessories, shoes, messy background`

    // ===== STABILITY API KALITLARI (Xavfsizlik tekshiruvi) =====
    const keysEnv = process.env.STABILITY_API_KEYS || process.env.STABILITY_API_KEY || ''
    const stabilityKeys = keysEnv.split(',').map(k => k.trim()).filter(Boolean)
    
    if (stabilityKeys.length === 0) {
      throw createError({ 
        statusCode: 500, 
        message: 'Stability AI kalitlari topilmadi. Iltimos, STABILITY_API_KEYS ni tekshiring.' 
      })
    }

    console.log(`${stabilityKeys.length} ta Stability kalit topildi`)

    // ===== BARCHA STABILITY KALITLARNI KETMA-KET TEKSHIRISH (LOOP) =====
    let generatedImageUrl = ''
    let lastError = null

    for (let i = 0; i < stabilityKeys.length; i++) {
      const key = stabilityKeys[i]
      try {
        console.log(`Stability kalit ${i + 1}/${stabilityKeys.length} tekshirilmoqda: ${key.substring(0, 8)}...`)
        generatedImageUrl = await generateAndUpload(finalPrompt, negativePrompt, key, supabase)
        console.log(`Stability kalit ${i + 1} muvaffaqiyatli ishladi!`)
        break
      } catch (err: any) {
        console.warn(`Stability kalit ${i + 1} ishlamadi: ${err.message}`)
        lastError = err
        
        // Agar oxirgi kalit bo'lsa, xatoni saqlaymiz
        if (i === stabilityKeys.length - 1) {
          console.error('Barcha Stability kalitlar ishlamadi')
        }
      }
    }

    // Agar hech qanday kalit ishlamasa
    if (!generatedImageUrl) {
      throw createError({ 
        statusCode: 500, 
        message: `Barcha Stability kalitlari ishlamadi: ${lastError?.message || 'Kredit tugagan bo\'lishi mumkin'}` 
      })
    }

    // ===== NATIJANI QAYTARISH =====
    return { 
      success: true,
      frontImage: generatedImageUrl,
      prompt: finalPrompt, // Debug uchun
      translatedPrompt: englishDesignDescription // Debug uchun
    }

  } catch (error: any) {
    console.error("AI Generation Error:", error)
    throw createError({ 
      statusCode: error.statusCode || 500, 
      message: error.message || 'Dizayn yaratishda xatolik yuz berdi' 
    })
  }
})