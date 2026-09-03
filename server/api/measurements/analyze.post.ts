import { GoogleGenAI, Type } from '@google/genai'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { imageUrl, productType } = body

    if (!imageUrl) {
      throw createError({
        statusCode: 400,
        message: "Rasm URL manzili ko'rsatilmadi",
      })
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      throw createError({
        statusCode: 500,
        message: "Gemini API key topilmadi",
      })
    }

    // 1. Rasmni URL orqali yuklab olamiz
    const imgResponse = await fetch(imageUrl)

    if (!imgResponse.ok) {
      throw new Error(
        `Rasmni yuklab bo'lmadi: ${imgResponse.status} ${imgResponse.statusText}`,
      )
    }

    const arrayBuffer = await imgResponse.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString('base64')

    let mimeType = imgResponse.headers.get('content-type') || 'image/jpeg'

    // Gemini faqat image MIME type qabul qilishi kerak
    if (!mimeType.startsWith('image/')) {
      mimeType = 'image/jpeg'
    }

    // 2. Gemini client
    const ai = new GoogleGenAI({
      apiKey,
    })

    // 3. AI prompt
    const prompt = `
You are an expert tailor and apparel production manager.

Analyze the provided image of the clothing item:
${productType || 'apparel'}

Estimate realistic proportional dimensions in centimeters based ONLY on
the visible characteristics of the garment.

IMPORTANT:
- These are visual estimates, not exact physical measurements.
- Return realistic production-oriented values.
- Do not invent unrelated measurements.
- Confidence score must be between 0 and 1.
`

    // 4. Gemini 2.5 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',

      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType,
                data: base64Image,
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
            chest_cm: {
              type: Type.NUMBER,
              description: 'Estimated chest measurement in centimeters',
            },

            length_cm: {
              type: Type.NUMBER,
              description: 'Estimated garment length in centimeters',
            },

            shoulder_cm: {
              type: Type.NUMBER,
              description: 'Estimated shoulder width in centimeters',
            },

            sleeve_cm: {
              type: Type.NUMBER,
              description: 'Estimated sleeve length in centimeters',
            },

            confidence_score: {
              type: Type.NUMBER,
              description:
                'Confidence score between 0 and 1 based on image quality and measurement reliability',
            },
          },

          required: [
            'chest_cm',
            'length_cm',
            'shoulder_cm',
            'sleeve_cm',
            'confidence_score',
          ],
        },
      },
    })

    // 5. Gemini response
    const resultText = response.text

    if (!resultText) {
      throw new Error('Gemini bo\'sh javob qaytardi')
    }

    console.log('Gemini measurement response:', resultText)

    // 6. JSON parse
    const dimensions = JSON.parse(resultText)

    // 7. Basic validation
    const requiredFields = [
      'chest_cm',
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

    // Confidence 0..1
    dimensions.confidence_score = Math.max(
      0,
      Math.min(1, dimensions.confidence_score),
    )

    return {
      success: true,
      dimensions,
    }
  } catch (error: any) {
    console.error('Gemini Dimensions Extraction Error:', error)

    throw createError({
      statusCode: error?.statusCode || 500,
      message:
        error?.message ||
        "AI o'lchamlarni aniqlay olmadi. Iltimos, qayta urinib ko'ring.",
    })
  }
})