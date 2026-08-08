import { enhanceFrontPrompt, enhanceBackPrompt, type GenerateDesignRequest, type GenerateDesignResponse } from '~/types/design'

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

async function generateSingleImage(
  token: string,
  prompt: string,
  label: string,
): Promise<string> {
  const prediction = await createPrediction(token, prompt)

  let finalPrediction = prediction
  if (prediction.status !== 'succeeded') {
    finalPrediction = await pollPrediction(token, prediction.urls.get)
  }

  const imageUrl = extractImageUrl(finalPrediction)

  if (!imageUrl) {
    throw createError({
      statusCode: 502,
      statusMessage: `${label}: no image URL in prediction output`,
    })
  }

  return imageUrl
}

export async function generateDesign(request: GenerateDesignRequest): Promise<GenerateDesignResponse> {
  if (!request.prompt.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Prompt is required',
    })
  }

  const token = getApiToken()
  const originalPrompt = request.prompt.trim()

  const frontPrompt = enhanceFrontPrompt(originalPrompt, request.style, request.shirtColor)
  const backPrompt = enhanceBackPrompt(originalPrompt, request.style, request.shirtColor)

  const [frontResult, backResult] = await Promise.all([
    generateSingleImage(token, frontPrompt, 'Front view').catch((err) => ({ error: err })),
    generateSingleImage(token, backPrompt, 'Back view').catch((err) => ({ error: err })),
  ])

  const frontError = 'error' in frontResult ? frontResult.error : null
  const backError = 'error' in backResult ? backResult.error : null
  const frontImage = typeof frontResult === 'string' ? frontResult : ''
  const backImage = typeof backResult === 'string' ? backResult : ''

  if (!frontImage && !backImage) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Both front and back generation failed. Please try again.',
    })
  }

  if (!frontImage) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Front view generation failed. Please try regenerating.',
    })
  }

  if (!backImage) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Back view generation failed. Please try regenerating.',
    })
  }

  return {
    frontImage,
    backImage,
    originalPrompt,
  }
}
