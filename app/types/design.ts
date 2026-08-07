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
  { id: 'streetwear', label: 'Стритвир', description: 'Смелый городской стиль' },
  { id: 'minimalist', label: 'Минимализм', description: 'Чистые линии, мало деталей' },
  { id: 'vintage', label: 'Винтаж', description: 'Ретро-эстетика, приглушённые тона' },
  { id: 'anime', label: 'Аниме', description: 'Яркий японский стиль' },
  { id: 'geometric', label: 'Геометрия', description: 'Абстрактные формы и узоры' },
  { id: 'typography', label: 'Типографика', description: 'Акцент на текст и шрифты' },
]

export type ShirtColor = 'black' | 'white' | 'gray' | 'navy' | 'olive' | 'burgundy'

export interface ShirtColorOption {
  id: ShirtColor
  label: string
  hex: string
}

export const SHIRT_COLORS: ShirtColorOption[] = [
  { id: 'black', label: 'Чёрный', hex: '#1a1a1a' },
  { id: 'white', label: 'Белый', hex: '#f5f5f5' },
  { id: 'gray', label: 'Серый', hex: '#9ca3af' },
  { id: 'navy', label: 'Тёмно-синий', hex: '#1e3a5f' },
  { id: 'olive', label: 'Оливковый', hex: '#4d5320' },
  { id: 'burgundy', label: 'Бордовый', hex: '#5c1a1a' },
]

export interface GenerateDesignRequest {
  prompt: string
  style: DesignStyle
  shirtColor: ShirtColor
}

export interface GenerateDesignResponse {
  id: string
  imageUrl: string
  prompt: string
}

const STYLE_PROMPT_MAP: Record<DesignStyle, string> = {
  streetwear: 'streetwear style, bold urban aesthetic',
  minimalist: 'minimalist style, clean lines, simple shapes',
  vintage: 'vintage retro aesthetic, distressed texture, muted tones',
  anime: 'anime style, vibrant cel shading, Japanese illustration',
  geometric: 'geometric abstract style, sharp angular shapes',
  typography: 'bold typography-focused design, lettering-centric',
}

const COLOR_PROMPT_MAP: Record<ShirtColor, string> = {
  black: 'black apparel mockup',
  white: 'white apparel mockup',
  gray: 'gray apparel mockup',
  navy: 'navy blue apparel mockup',
  olive: 'olive green apparel mockup',
  burgundy: 'burgundy apparel mockup',
}

export function enhancePrompt(prompt: string, style: DesignStyle, shirtColor: ShirtColor): string {
  const cleanPrompt = prompt.trim().replace(/\s+/g, ' ')
  const stylePart = STYLE_PROMPT_MAP[style] ?? STYLE_PROMPT_MAP.streetwear
  const colorPart = COLOR_PROMPT_MAP[shirtColor] ?? COLOR_PROMPT_MAP.black

  return [
    'Premium vector t-shirt graphic of',
    cleanPrompt,
    'centered composition, transparent background,',
    stylePart + ',',
    colorPart + ',',
    'highly detailed, print-ready, no watermark, no text, isolated artwork',
  ].join(' ')
}
