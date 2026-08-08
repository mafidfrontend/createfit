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
  frontImage: string
  backImage: string
  originalPrompt: string
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

const FRONT_VIEW_CONSTRAINTS = [
  'Generate exactly ONE person, full-body view, strictly front-facing (facing the camera directly)',
  'the same person and identity as the reference image',
  'wearing the same clothing and design described above',
  'single person only',
  'no collage, no split screen, no side-by-side people, no multiple views in one image',
  'no front-and-back composite, no duplicate person, no grid layout',
].join(', ')

const BACK_VIEW_CONSTRAINTS = [
  'Generate exactly ONE person, full-body view, strictly back-facing (facing away from the camera)',
  'the same person and identity as the reference image, same proportions, outfit, colors and general visual style',
  'the face should NOT be visible from the front',
  'single person only',
  'no collage, no split screen, no side-by-side people, no multiple views in one image',
  'no front-and-back composite, no duplicate person, no grid layout',
].join(', ')

function buildBasePrompt(prompt: string, style: DesignStyle, shirtColor: ShirtColor): string {
  const cleanPrompt = prompt.trim().replace(/\s+/g, ' ')
  const stylePart = STYLE_PROMPT_MAP[style] ?? STYLE_PROMPT_MAP.streetwear
  const colorPart = COLOR_PROMPT_MAP[shirtColor] ?? COLOR_PROMPT_MAP.black

  return [
    cleanPrompt,
    stylePart + ',',
    colorPart + ',',
    'highly detailed, print-ready, no watermark, isolated on plain background',
  ].join(' ')
}

export function enhanceFrontPrompt(prompt: string, style: DesignStyle, shirtColor: ShirtColor): string {
  return [buildBasePrompt(prompt, style, shirtColor), '. FRONT VIEW:', FRONT_VIEW_CONSTRAINTS].join('')
}

export function enhanceBackPrompt(prompt: string, style: DesignStyle, shirtColor: ShirtColor): string {
  return [buildBasePrompt(prompt, style, shirtColor), '. BACK VIEW:', BACK_VIEW_CONSTRAINTS].join('')
}
