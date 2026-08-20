import { analyzePhoto } from '~/server/services/gemini'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ photo: string; mimeType: string }>(event)
  if (!body?.photo || !body.mimeType) throw createError({ statusCode: 400, statusMessage: 'Загрузите фото для анализа.' })
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(body.mimeType)) throw createError({ statusCode: 400, statusMessage: 'Поддерживаются форматы JPG, PNG и WEBP.' })
  const imageBase64 = body.photo.replace(/^data:[^;]+;base64,/, '')
  try {
    return await analyzePhoto(imageBase64, body.mimeType)
  } catch (error: unknown) {
    if (isError(error)) throw error
    console.error('Measurement analysis failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Не удалось проанализировать фото. Попробуйте ещё раз.' })
  }
})
