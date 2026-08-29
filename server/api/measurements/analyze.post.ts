export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { imageUrl, productType } = body

    if (!imageUrl) {
      throw createError({ statusCode: 400, message: "Rasm URL manzil ko'rsatilmadi" })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw createError({ statusCode: 500, message: "Gemini API key topilmadi" })
    }

    // 1. Rasmni fetch qilib, Base64 ga o'tkazamiz
    const imgResponse = await fetch(imageUrl)
    const arrayBuffer = await imgResponse.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString('base64')
    
    let mimeType = imgResponse.headers.get('content-type') || 'image/jpeg'
    if (!mimeType.startsWith('image/')) {
      mimeType = 'image/jpeg'
    }

    // 2. Promptni JSON uchun aniqroq qilib yozamiz
    const prompt = `You are an expert tailor and apparel production manager. Analyze the provided image of the clothing item (${productType || 'apparel'}). 
    Extract and estimate the realistic proportional dimensions (in centimeters) for standard production based on the visual features of this item. 
    Return ONLY a JSON object with EXACTLY the following keys (all numbers): "chest_cm", "length_cm", "shoulder_cm", "sleeve_cm", "confidence_score".`

    // Standart gemini-1.5-flash modelidan foydalanamiz
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

    const response = await $fetch<any>(geminiUrl, {
      method: 'POST',
      body: {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          // Eng muhimi: sxemani olib tashladik, faqat JSON formatni talab qilamiz
          responseMimeType: 'application/json'
        }
      }
    })

    const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text
    if (!resultText) {
      throw new Error("Gemini bo'sh javob qaytardi")
    }

    const dimensions = JSON.parse(resultText)

    return {
      success: true,
      dimensions
    }

  } catch (error: any) {
    console.error("Gemini Xatoligi:", error.data || error)
    const aiErrorMessage = error.data?.error?.message || error.message || "Noma'lum xatolik"
    
    throw createError({ 
      statusCode: 400, 
      message: `Gemini: ${aiErrorMessage}` 
    })
  }
})