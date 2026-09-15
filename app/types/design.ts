export type DesignStyle =
  | 'streetwear'
  | 'minimalist'
  | 'vintage'
  | 'anime'
  | 'geometric'
  | 'typography'

export interface DesignStyleOption {
  id: DesignStyle
  label: string
  description: string
}

export const DESIGN_STYLES: DesignStyleOption[] = [
  {
    id: 'streetwear',
    label: 'Стритвир',
    description: 'Смелая городская эстетика',
  },
  {
    id: 'minimalist',
    label: 'Минимализм',
    description: 'Чистые линии, мало деталей',
  },
  {
    id: 'vintage',
    label: 'Винтаж',
    description: 'Ретро-эстетика, приглушённые тона',
  },
  {
    id: 'anime',
    label: 'Аниме',
    description: 'Яркий японский стиль',
  },
  {
    id: 'geometric',
    label: 'Геометрия',
    description: 'Абстрактные формы и узоры',
  },
  {
    id: 'typography',
    label: 'Типографика',
    description: 'Акцент на текст и шрифты',
  },
]

export type ShirtColor =
  | 'black'
  | 'white'
  | 'gray'
  | 'navy'
  | 'olive'
  | 'burgundy'

export interface ShirtColorOption {
  id: ShirtColor
  label: string
  hex: string
}

export const SHIRT_COLORS: ShirtColorOption[] = [
  {
    id: 'black',
    label: 'Чёрный',
    hex: '#1a1a1a',
  },
  {
    id: 'white',
    label: 'Белый',
    hex: '#f5f5f5',
  },
  {
    id: 'gray',
    label: 'Серый',
    hex: '#9ca3af',
  },
  {
    id: 'navy',
    label: 'Тёмно-синий',
    hex: '#1e3a5f',
  },
  {
    id: 'olive',
    label: 'Оливковый',
    hex: '#4d5320',
  },
  {
    id: 'burgundy',
    label: 'Бордовый',
    hex: '#5c1a1a',
  },
]

/**
 * Request sent to /api/design/generate
 *
 * Backend expects `color`, not `shirtColor`.
 */
export interface GenerateDesignRequest {
  productType: string
  productName: string
  fabric: string
  color: ShirtColor
  style: DesignStyle
  prompt: string
  uploadedImageUrl?: string | null
}

/**
 * Current backend returns one composite image:
 *
 * LEFT  = front
 * RIGHT = back
 *
 * Therefore backImage is optional.
 */
export interface GenerateDesignResponse {
  success: true

  frontImage: string
  backImage?: string | null

  translatedPrompt?: string

  artwork?: {
    language: string
    artworkDescription: string
    mainSubject: string
    colors: string[]
    style: string
    composition: string
    details: string[]
    background: string
  }

  product?: {
    productType: string
    productName: string
    fabric: string
    color: string
    style: string
  }

  prompt?: string
  negativePrompt?: string

  metadata?: {
    aspectRatio: string
    hasReferenceImage: boolean
    provider: string
    textAnalyzer: string
  }
}

export interface GenerateDesignErrorResponse {
  success: false
  error: string
}