import { enhanceFrontPrompt, enhanceBackPrompt, type GenerateDesignRequest, type GenerateDesignResponse } from '~/types/design'

const REPLICATE_API_BASE = 'https://api.replicate.com/v1'
const FLUX_MODEL = 'black-forest-labs/flux-1.1-pro'

const MAX_POLL_ATTEMPTS = 30
const POLL_INTERVAL_MS = 2000

type PredictionStatus = 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'

interface ReplicatePrediction {
  id: string
  status: PredictionStatus
  output: string | string[] | null
  error: string | null
  urls: {
    get: string
  }
}

interface GenerationResult {
  success: boolean
  image: string
  error: string
}

interface ReplicateApiError {
  statusCode: number
  message: string
}

function createApiError(statusCode: number, message: string): ReplicateApiError {
  return { statusCode, message }
}

function isApiError(obj: unknown): obj is ReplicateApiError {
  return typeof obj === 'object' && obj !== null && 'statusCode' in obj && 'message' in obj
}

function getApiToken(): string {
  const config = useRuntimeConfig()
  const token = config.replicateToken
  if (!token) {
    throw createApiError(500, 'Replicate API token is not configured')
  }
  return token
}

async function createPrediction(token: string, prompt: string, seed: number, label: string): Promise<ReplicatePrediction> {
  console.log(`[${label}] Creating prediction — seed: ${seed}`)

  const response = await fetch(`${REPLICATE_API_BASE}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: FLUX_MODEL,
      input: {
        prompt,
        aspect_ratio: '1:1',
        output_format: 'webp',
        output_quality: 90,
        safety_tolerance: 2,
        seed,
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'unknown')
    console.error(`[${label}] Prediction creation failed: ${response.status} ${response.statusText} — ${errorBody}`)
    throw createApiError(response.status, `Replicate prediction failed: ${response.statusText}`)
  }

  const prediction = await response.json() as ReplicatePrediction
  console.log(`[${label}] Prediction created — id: ${prediction.id}, status: ${prediction.status}`)
  return prediction
}

async function pollPrediction(token: string, predictionUrl: string, label: string): Promise<ReplicatePrediction> {
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
    const response = await fetch(predictionUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      console.error(`[${label}] Poll attempt ${attempt} failed: ${response.status} ${response.statusText}`)
      throw createApiError(response.status, `Failed to poll prediction: ${response.statusText}`)
    }

    const prediction = await response.json() as ReplicatePrediction
    console.log(`[${label}] Poll attempt ${attempt}/${MAX_POLL_ATTEMPTS} — status: ${prediction.status}`)

    if (prediction.status === 'succeeded') {
      return prediction
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      const errorMsg = prediction.error ?? `Prediction ${prediction.status}`
      console.error(`[${label}] Prediction ${prediction.status}: ${errorMsg}`)
      throw createApiError(502, errorMsg)
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }

  console.error(`[${label}] Prediction timed out after ${MAX_POLL_ATTEMPTS} attempts`)
  throw createApiError(504, 'Prediction timed out — please try again')
}

function extractImageUrl(prediction: ReplicatePrediction, label: string): string {
  if (!prediction.output) {
    console.error(`[${label}] Prediction returned no output`)
    throw createApiError(502, 'Prediction returned no image output')
  }

  const imageUrl = Array.isArray(prediction.output)
    ? (prediction.output[0] ?? '')
    : prediction.output

  if (!imageUrl) {
    console.error(`[${label}] Prediction output was empty`)
    throw createApiError(502, 'Prediction returned an empty image URL')
  }

  return imageUrl
}

async function generateSingleImage(
  token: string,
  prompt: string,
  seed: number,
  label: string,
): Promise<GenerationResult> {
  try {
    const prediction = await createPrediction(token, prompt, seed, label)

    let finalPrediction = prediction
    if (prediction.status !== 'succeeded') {
      finalPrediction = await pollPrediction(token, prediction.urls.get, label)
    }

    const imageUrl = extractImageUrl(finalPrediction, label)
    console.log(`[${label}] Generation succeeded — image URL obtained`)
    return { success: true, image: imageUrl, error: '' }
  } catch (err: unknown) {
    const message = isApiError(err) ? err.message : err instanceof Error ? err.message : 'Unknown error'
    console.error(`[${label}] Generation failed: ${message}`)
    return { success: false, image: '', error: message }
  }
}

export async function generateDesign(request: GenerateDesignRequest): Promise<GenerateDesignResponse> {
  const originalPrompt = request.prompt.trim()

  if (!originalPrompt) {
    throw createApiError(400, 'Prompt is required')
  }

  const token = getApiToken()
  const style = request.style
  const shirtColor = request.shirtColor

  console.log(`[generateDesign] Request received — prompt: "${originalPrompt}", style: ${style}, shirtColor: ${shirtColor}`)

  const sharedSeed = Math.floor(Math.random() * 2_147_483_647)
  const frontPrompt = enhanceFrontPrompt(originalPrompt, style, shirtColor)
  const backPrompt = enhanceBackPrompt(originalPrompt, style, shirtColor)

  console.log('[generateDesign] Starting front view generation')
  const frontResult = await generateSingleImage(token, frontPrompt, sharedSeed, 'Front')

  if (!frontResult.success) {
    console.error(`[generateDesign] Front view failed — aborting before back view. Error: ${frontResult.error}`)
    throw createApiError(502, `Front view generation failed: ${frontResult.error}`)
  }

  console.log('[generateDesign] Starting back view generation')
  const backResult = await generateSingleImage(token, backPrompt, sharedSeed, 'Back')

  if (!backResult.success) {
    console.error(`[generateDesign] Back view failed. Front succeeded but back did not. Error: ${backResult.error}`)
    throw createApiError(502, `Back view generation failed: ${backResult.error}. Please regenerate.`)
  }

  console.log('[generateDesign] Both views generated successfully')
  return {
    frontImage: frontResult.image,
    backImage: backResult.image,
    originalPrompt,
  }
}

export { createApiError, isApiError, type ReplicateApiError, type GenerateDesignResponse }
