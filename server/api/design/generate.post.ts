import { generateDesign, createApiError, isApiError, type ReplicateApiError } from '../../services/replicate'
import type { GenerateDesignRequest, GenerateDesignResponse } from '~/types/design'

interface ErrorResponse {
  success: false
  error: string
}

type HandlerResponse = GenerateDesignResponse | ErrorResponse

export default defineEventHandler(async (event): Promise<HandlerResponse> => {
  const body = await readBody<GenerateDesignRequest>(event)

  if (!body || !body.prompt || !body.style || !body.shirtColor) {
    return {
      success: false,
      error: 'Missing required fields: prompt, style, shirtColor',
    }
  }

  try {
    const result = await generateDesign({
      prompt: body.prompt,
      style: body.style,
      shirtColor: body.shirtColor,
    })

    return result
  } catch (err: unknown) {
    let statusCode = 500
    let message = 'An unexpected error occurred during generation'

    if (isApiError(err)) {
      const apiError = err as ReplicateApiError
      statusCode = apiError.statusCode
      message = apiError.message
    } else if (err instanceof Error) {
      message = err.message
    }

    console.error(`[generate.post] Generation failed — status: ${statusCode}, error: ${message}`)

    setResponseStatus(event, statusCode)
    return {
      success: false,
      error: message,
    }
  }
})
