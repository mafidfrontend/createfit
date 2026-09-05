import { GoogleGenAI, Type } from '@google/genai'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    // Frontenddan yuborilgan userHeight ni ham qabul qilamiz
    const { frontImageBase64, frontImageMime, sideImageBase64, sideImageMime, productType, userHeight } = body

    if (!frontImageBase64 || !sideImageBase64) {
      throw createError({ statusCode: 400, message: "Old va yon tomon rasmlari to'liq yuklanmadi" })
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
    if (!apiKey) {
      throw createError({ statusCode: 500, message: "Gemini API key topilmadi" })
    }

    const getCleanBase64 = (b64: string) => b64.includes(',') ? b64.split(',')[1] : b64
    const cleanFrontBase64 = getCleanBase64(frontImageBase64)
    const cleanSideBase64 = getCleanBase64(sideImageBase64)

    const ai = new GoogleGenAI({ apiKey })

    // PROMPT YANGILANDI: Bo'y va A4 qog'oz etalon (masshtab) sifatida belgilandi!
    const prompt = `
You are an expert tailor and apparel production manager.

Analyze the TWO provided images (front view and side view) of the user/clothing item:
Product type: ${productType || 'apparel'}

CRITICAL CALIBRATION DATA: 
1. The absolute exact height of the user in the image is ${userHeight || 170} cm. Use this total height to establish your pixel-to-centimeter scale perfectly.
2. The user might be holding a standard A4 paper (which is exactly 21cm x 29.7cm). If visible, use the paper as an additional secondary scale reference.

Estimate realistic proportional body dimensions in centimeters based ONLY on the visible characteristics in both profiles, mapped against the height of ${userHeight || 170} cm. 

Additionally, determine the most appropriate standard international size (XS, S, M, L, XL, XXL) for this user based on their measurements.

IMPORTANT:
- Return realistic, anatomically correct production-oriented values.
- Confidence score must be between 0 and 1.
`

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: frontImageMime || 'image/jpeg', data: cleanFrontBase64 } },
            { inlineData: { mimeType: sideImageMime || 'image/jpeg', data: cleanSideBase64 } },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            predicted_size: { type: Type.STRING, description: 'Estimated standard international size (e.g., XS, S, M, L, XL, XXL)' },
            chest_cm: { type: Type.NUMBER, description: 'Estimated chest measurement in centimeters' },
            waist_cm: { type: Type.NUMBER, description: 'Estimated waist measurement in centimeters' },
            hips_cm: { type: Type.NUMBER, description: 'Estimated hips measurement in centimeters' },
            length_cm: { type: Type.NUMBER, description: 'Estimated garment length in centimeters' },
            shoulder_cm: { type: Type.NUMBER, description: 'Estimated shoulder width in centimeters' },
            sleeve_cm: { type: Type.NUMBER, description: 'Estimated sleeve length in centimeters' },
            confidence_score: { type: Type.NUMBER, description: 'Confidence score between 0 and 1' },
          },
          required: [
            'predicted_size',
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

    const resultText = response.text
    if (!resultText) throw new Error('Gemini bo\'sh javob qaytardi')

    console.log('Gemini measurement response:', resultText)
    const dimensions = JSON.parse(resultText)

    dimensions.confidence_score = Math.max(0, Math.min(1, dimensions.confidence_score))

    return { success: true, dimensions }
  } catch (error: any) {
    console.error('Gemini Dimensions Extraction Error:', error)
    throw createError({
      statusCode: error?.statusCode || 500,
      message: error?.message || "AI o'lchamlarni aniqlay olmadi. Iltimos, qayta urinib ko'ring.",
    })
  }
})