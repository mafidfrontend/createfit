import type { MeasurementResult } from '~/types/design'

interface GeminiResponse { candidates?: { content?: { parts?: { text?: string }[] } }[]; error?: { message?: string } }

export async function analyzePhoto(imageBase64: string, mimeType: string): Promise<MeasurementResult> {
  const config = useRuntimeConfig()
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY
  if (!apiKey) throw createError({ statusCode: 503, statusMessage: 'Анализ мерок сейчас недоступен.' })

  const instruction = `Analyze this full-body clothing photo and estimate body proportions only when the image is sufficient. Return only valid JSON with this structure: {"measurements":{"height":"","chest":"","waist":"","hips":"","shoulder":"","sleeve":""},"recommendedSize":"XS|S|M|L|XL|XXL|XXXL","confidence":0,"notes":""}. Confidence must be a whole number from 0 to 100. All measurements are estimates, never exact. If the photo is unclear, use empty measurement values, low confidence, and explain that a better full-body photo or manual measurements are needed.`
  let response: GeminiResponse
  try {
    // AYNAN SHU QATOR O'ZGARTIRILDI: -latest qo'shildi
    response = await $fetch<GeminiResponse>('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent', {
      method: 'POST',
      query: { key: apiKey },
      headers: { 'Content-Type': 'application/json' },
      body: { contents: [{ parts: [{ text: instruction }, { inline_data: { mime_type: mimeType, data: imageBase64 } }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } },
      timeout: 60000
    })
  } catch (error: unknown) {
    console.error('Gemini request failed', error)
    throw createError({ statusCode: 502, statusMessage: 'Не удалось проанализировать фото. Попробуйте другое фото.' })
  }

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw createError({ statusCode: 502, statusMessage: 'Не удалось получить результат анализа.' })
  try {
    const result = JSON.parse(text) as MeasurementResult
    if (!result.recommendedSize || typeof result.confidence !== 'number' || !result.measurements) throw new Error('Invalid response')
    return result
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Результат анализа оказался неполным. Попробуйте другое фото.' })
  }
}