import { GoogleGenAI, Type } from '@google/genai'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    // Frontenddan 2 ta rasmni Base64 ko'rinishida qabul qilamiz
    const { frontImageBase64, frontImageMime, sideImageBase64, sideImageMime, productType } = body

    if (!frontImageBase64 || !sideImageBase64) {
      throw createError({
        statusCode: 400,
        message: "Old va yon tomon rasmlari to'liq yuklanmadi",
      })
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY

    if (!apiKey) {
      throw createError({
        statusCode: 500,
        message: "Gemini API key topilmadi",
      })
    }

    // Base64 matnidan `data:image/jpeg;base64,` kabi prefikslarni tozalovchi funksiya
    const getCleanBase64 = (b64: string) => b64.includes(',') ? b64.split(',')[1] : b64
    const cleanFrontBase64 = getCleanBase64(frontImageBase64)
    const cleanSideBase64 = getCleanBase64(sideImageBase64)

    // 1. Gemini client
    const ai = new GoogleGenAI({ apiKey })

    // 2. AI prompt
    const prompt = `
You are an expert tailor and apparel production manager.

Analyze the TWO provided images (front view and side view) of the user/clothing item:
Product type: ${productType || 'apparel'}

Estimate realistic proportional body dimensions in centimeters based ONLY on
the visible characteristics in both the front and side profiles.

IMPORTANT:
- These are visual estimates, not exact physical measurements.
- Return realistic production-oriented values.
- Do not invent unrelated measurements.
- Confidence score must be between 0 and 1.
`

    // 3. Gemini 3.8 Flash orqali Multimodal tahlil va qat'iy JSON Schema
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: frontImageMime || 'image/jpeg',
                data: cleanFrontBase64,
              },
            },
            {
              inlineData: {
                mimeType: sideImageMime || 'image/jpeg',
                data: cleanSideBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chest_cm: { type: Type.NUMBER, description: 'Estimated chest measurement in centimeters' },
            waist_cm: { type: Type.NUMBER, description: 'Estimated waist measurement in centimeters' },
            hips_cm: { type: Type.NUMBER, description: 'Estimated hips measurement in centimeters' },
            length_cm: { type: Type.NUMBER, description: 'Estimated garment length in centimeters' },
            shoulder_cm: { type: Type.NUMBER, description: 'Estimated shoulder width in centimeters' },
            sleeve_cm: { type: Type.NUMBER, description: 'Estimated sleeve length in centimeters' },
            confidence_score: { type: Type.NUMBER, description: 'Confidence score between 0 and 1 based on image quality' },
          },
          required: [
            'chest_cm',
            'waist_cm',
            'hips_cm',
            'length_cm',
            'shoulder_cm',
            'sleeve_cm',
            'confidence_score',
          ],
        },
      },
    })

    // 4. Gemini response
    const resultText = response.text

    if (!resultText) {
      throw new Error('Gemini bo\'sh javob qaytardi')
    }

    console.log('Gemini measurement response:', resultText)

    // 5. JSON parse
    const dimensions = JSON.parse(resultText)

    // 6. Basic validation
    const requiredFields = [
      'chest_cm',
      'waist_cm',
      'hips_cm',
      'length_cm',
      'shoulder_cm',
      'sleeve_cm',
      'confidence_score',
    ]

    for (const field of requiredFields) {
      if (
        typeof dimensions[field] !== 'number' ||
        !Number.isFinite(dimensions[field])
      ) {
        throw new Error(`Gemini noto'g'ri qiymat qaytardi: ${field}`)
      }
    }

    // Confidence 0..1 qoidalari
    dimensions.confidence_score = Math.max(0, Math.min(1, dimensions.confidence_score))

    return {
      success: true,
      dimensions,
    }
  } catch (error: any) {
    console.error('Gemini Dimensions Extraction Error:', error)

    throw createError({
      statusCode: error?.statusCode || 500,
      message: error?.message || "AI o'lchamlarni aniqlay olmadi. Iltimos, qayta urinib ko'ring.",
    })
  }
})