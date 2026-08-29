export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { imageUrl, productType } = body

    if (!imageUrl) {
      throw createError({ statusCode: 400, message: "Rasm URL manzil ko'rsatilmadi" })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw createError({ statusCode: 500, message: "API key topilmadi" })
    }

    // 1. Rasmni fetch qilib, Base64 ga o'tkazamiz
    const imgResponse = await fetch(imageUrl)
    const arrayBuffer = await imgResponse.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = imgResponse.headers.get('content-type') || 'image/png'

    const prompt = `You are an expert tailor and apparel production manager. Analyze the provided image of the clothing item (${productType || 'apparel'}). 
    Extract and estimate the realistic proportional dimensions (in centimeters) for standard production based on the visual features of this item. 
    Return the dimensions strictly in JSON format.`

    // 2. Nuxt'ning o'zining $fetch funksiyasi bilan Gemini 1.5 Flash REST API ga to'g'ridan-to'g'ri ulanamiz (SDK'siz)
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
          responseMimeType: 'application/json',
          responseSchema: {
            type: "OBJECT",
            properties: {
              chest_cm: { type: "NUMBER", description: "Chest width in cm" },
              length_cm: { type: "NUMBER", description: "Total length in cm" },
              shoulder_cm: { type: "NUMBER", description: "Shoulder width in cm" },
              sleeve_cm: { type: "NUMBER", description: "Sleeve length in cm" }
            },
            required: ["chest_cm", "length_cm", "shoulder_cm", "sleeve_cm"]
          }
        }
      }
    })

    // 3. Javobni ajratib olamiz
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
    console.error("Gemini Xatoligi:", error)
    throw createError({ 
      statusCode: 502, 
      message: "AI o'lchamlarni aniqlay olmadi. Iltimos, qayta urinib ko'ring." 
    })
  }
})