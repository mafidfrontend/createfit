import { generateDesign } from '~/server/services/replicate'
import type { GenerateDesignRequest } from '~/types/design'

export default defineEventHandler(async (event) => {
  const body = await readBody<GenerateDesignRequest>(event)
  if (!body?.productType || !body.productName || !body.fabric || !body.color || !body.style) {
    throw createError({ statusCode: 400, statusMessage: 'Выберите изделие, ткань, цвет и стиль.' })
  }
  try {
    return await generateDesign(body)
  } catch (error: unknown) {
    if (isError(error)) throw error
    console.error('Design generation failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Не удалось сгенерировать дизайн. Попробуйте ещё раз.' })
  }
})
