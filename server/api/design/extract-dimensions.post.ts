import { GoogleGenAI, Type } from '@google/genai'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { imageUrl, productType } = body

    if (!imageUrl) {
      throw createError({ statusCode: 400, message: "Rasm URL manzil ko'rsatilmadi" })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw createError({ statusCode: 500, message: 'Gemini API key topilmadi' })
    }

    // 1. Rasmni fetch qilib, Buffer ga o'tkazamiz
    const imgResponse = await fetch(imageUrl)
    const arrayBuffer = await imgResponse.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = imgResponse.headers.get('content-type') || 'image/png'

    // 2. Gemini SDK ni retsializatsiya qilamiz
    const ai = new GoogleGenAI({ apiKey })

    // 3. Prompt va kutilayotgan structured JSON sxemasi
    const prompt = `You are an expert tailor and apparel production manager. Analyze the provided image of the clothing item (${productType || 'apparel'}). 
    Extract and estimate the realistic proportional dimensions (in centimeters) for standard production based on the visual features of this item. 
    Return the dimensions strictly in JSON format.`

    // 4. Gemini 2.5 Flash modeliga structured JSON so'rovi yuboramiz
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image
          }
        },
        prompt
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chest_cm: { type: Type.NUMBER, description: 'Chest width in cm' },
            length_cm: { type: Type.NUMBER, description: 'Total length in cm' },
            shoulder_cm: { type: Type.NUMBER, description: 'Shoulder width in cm' },
            sleeve_cm: { type: Type.NUMBER, description: 'Sleeve length in cm' },
            confidence_score: { type: Type.NUMBER, description: 'Estimation confidence score between 0 and 1' }
          },
          required: ['chest_cm', 'length_cm', 'shoulder_cm', 'sleeve_cm']
        }
      }
    })

    const resultText = response.text
    if (!resultText) {
      throw new Error("Gemini javob qaytarmadi")
    }

    // JSON shaklida natijani qaytaramiz
    const dimensions = JSON.parse(resultText)
    return {
      success: true,
      dimensions
    }

  } catch (error: any) {
    console.error("Gemini Dimensions Extraction Error:", error)
    throw createError({ 
      statusCode: error.statusCode || 500, 
      message: "AI o'lchamlarni aniqlay olmadi. Iltimos, qayta urinib ko'ring." 
    })
  }
})