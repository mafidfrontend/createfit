import { enhancePrompt, type GenerateDesignRequest, type GenerateDesignResponse } from '~/types/design'

const REPLICATE_API_BASE = 'https://api.replicate.com/v1'
const FLUX_PRO_MODEL = 'black-forest-labs/flux-1.1-pro'

interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output: string | string[] | null
  error: string | null
  urls: {
    get: string
  }
}

function getApiToken(): string {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Replicate API token is not configured',
    })
  }
  return token
}

async function createPrediction(
  token: string,
  prompt: string,
): Promise<ReplicatePrediction> {
  const response = await fetch(`${REPLICATE_API_BASE}/models/${FLUX_PRO_MODEL}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'wait',
    },
    body: JSON.stringify({
      input: {
        prompt,
        aspect_ratio: '1:1',
        output_format: 'png',
        safety_tolerance: 2,
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: `Replicate prediction failed: ${response.statusText}`,
      data: { errorBody },
    })
  }

  return response.json() as Promise<ReplicatePrediction>
}

async function pollPrediction(
  token: string,
  predictionUrl: string,
  maxAttempts = 120,
  intervalMs = 2000,
): Promise<ReplicatePrediction> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(predictionUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Failed to poll prediction: ${response.statusText}`,
      })
    }

    const prediction = (await response.json()) as ReplicatePrediction

    if (prediction.status === 'succeeded') {
      return prediction
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw createError({
        statusCode: 502,
        statusMessage: prediction.error ?? `Prediction ${prediction.status}`,
      })
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw createError({
    statusCode: 504,
    statusMessage: 'Prediction timed out',
  })
}

function extractImageUrl(prediction: ReplicatePrediction): string {
  if (!prediction.output) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Prediction returned no output',
    })
  }

  if (Array.isArray(prediction.output)) {
    return prediction.output[0] ?? ''
  }

  return prediction.output
}

export async function generateDesign(request: GenerateDesignRequest): Promise<GenerateDesignResponse> {
  if (!request.prompt.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Prompt is required',
    })
  }

  const token = getApiToken()
  const enhancedPrompt = enhancePrompt(request.prompt, request.style, request.shirtColor)

  const prediction = await createPrediction(token, enhancedPrompt)

  let finalPrediction = prediction
  if (prediction.status !== 'succeeded') {
    finalPrediction = await pollPrediction(token, prediction.urls.get)
  }

  const imageUrl = extractImageUrl(finalPrediction)

  if (!imageUrl) {
    throw createError({
      statusCode: 502,
      statusMessage: 'No image URL in prediction output',
    })
  }

  return {
    id: finalPrediction.id,
    imageUrl,
    prompt: enhancedPrompt,
  }
}
