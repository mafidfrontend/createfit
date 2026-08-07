import { generateDesign } from '../../services/replicate'
import type { GenerateDesignRequest, GenerateDesignResponse } from '~/types/design'

export default defineEventHandler(async (event): Promise<GenerateDesignResponse> => {
  const body = await readBody<GenerateDesignRequest>(event)

  if (!body || !body.prompt || !body.style || !body.shirtColor) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: prompt, style, shirtColor',
    })
  }

  return generateDesign({
    prompt: body.prompt,
    style: body.style,
    shirtColor: body.shirtColor,
  })
})
