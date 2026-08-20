import type { GenerateDesignRequest, GenerateDesignResponse, DesignStyle, ShirtColor } from '~/types/design'

const styleLabels: Record<DesignStyle, string> = {
  minimal: 'minimalist, clean lines, understated',
  streetwear: 'streetwear, urban, edgy',
  classic: 'classic, timeless, elegant',
  sport: 'sporty, athletic, dynamic',
  artistic: 'artistic, creative, expressive'
}

const colorLabels: Record<ShirtColor, string> = {
  white: 'white', black: 'black', gray: 'gray', navy: 'navy blue', red: 'red', green: 'green', blue: 'blue', sand: 'sand beige'
}

function buildPrompt(request: GenerateDesignRequest): string {
  const parts = [
    `A ${colorLabels[request.color]} ${request.productName.toLowerCase()}`,
    `made of ${request.fabric.toLowerCase()} fabric`,
    `${styleLabels[request.style]} clothing design`
  ]
  if (request.prompt.trim()) parts.push(`design concept: ${request.prompt.trim()}`)
  if (request.logoImageName) parts.push(`preserve the visual identity of the uploaded logo or artwork named ${request.logoImageName}`)
  if (request.bodyInfo) parts.push(`fit the following estimated body proportions: ${request.bodyInfo}`)
  return parts.join(', ')
}

const negativePrompt = 'multiple people, collage, split screen, duplicate person, watermark, text overlay, distorted clothing, blurry, low quality'

async function createImage(prompt: string, token: string, referenceImage: string | null): Promise<string> {
  const response = await $fetch<{ output?: string | string[]; error?: string }>('https://api.replicate.com/v1/models/stability-ai/sdxl/predictions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'wait' },
    body: { input: { prompt, negative_prompt: negativePrompt, width: 768, height: 1024, num_outputs: 1, ...(referenceImage ? { image: referenceImage } : {}) } },
    timeout: 120000
  })
  if (response.error) throw new Error(response.error)
  if (Array.isArray(response.output)) return response.output[0]
  if (typeof response.output === 'string') return response.output
  throw new Error('Replicate returned no image')
}

export async function generateDesign(request: GenerateDesignRequest): Promise<GenerateDesignResponse> {
  const config = useRuntimeConfig()
  const token = config.replicateApiToken || process.env.REPLICATE_API_TOKEN
  if (!token) throw createError({ statusCode: 503, statusMessage: 'Генерация дизайна сейчас недоступна.' })

  const basePrompt = buildPrompt(request)
  const [frontImage, backImage] = await Promise.all([
    createImage(`${basePrompt}. Exactly one person, full body, strictly front-facing, garment and design clearly visible, clean studio product photography, no background distractions.`, token, request.logoImageBase64 ?? null),
    createImage(`${basePrompt}. Exactly one person, full body, strictly back-facing, same person, proportions, outfit and style, face not visible from the front, garment and back design clearly visible, clean studio product photography, no background distractions.`, token, request.logoImageBase64 ?? null)
  ])
  return { frontImage, backImage, originalPrompt: basePrompt }
}
