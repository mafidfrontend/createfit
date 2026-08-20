export type DesignStyle = 'minimal' | 'streetwear' | 'classic' | 'sport' | 'artistic'
export type ShirtColor = 'white' | 'black' | 'gray' | 'navy' | 'red' | 'green' | 'blue' | 'sand'

export interface MeasurementResult {
  measurements: {
    height?: string | number
    chest?: string | number
    waist?: string | number
    hips?: string | number
    shoulder?: string | number
    sleeve?: string | number
  }
  recommendedSize: string
  confidence: number
  notes: string
}

export interface GenerateDesignRequest {
  productType: string
  productName: string
  fabric: string
  color: ShirtColor
  style: DesignStyle
  prompt: string
  logoImageBase64?: string | null
  logoImageName?: string | null
  bodyInfo?: string | null
}

export interface GenerateDesignResponse {
  frontImage: string
  backImage: string
  originalPrompt: string
}

export const DESIGN_STYLES: { id: DesignStyle; name: string; description: string }[] = [
  { id: 'minimal', name: 'Минимализм', description: 'Чистые линии, без лишнего' },
  { id: 'streetwear', name: 'Стритвир', description: 'Городской стиль и свобода' },
  { id: 'classic', name: 'Классика', description: 'Сдержанный и элегантный' },
  { id: 'sport', name: 'Спорт', description: 'Динамичный и функциональный' },
  { id: 'artistic', name: 'Арт-дизайн', description: 'Творческий и выразительный' }
]

export const SHIRT_COLORS: { id: ShirtColor; name: string; hex: string }[] = [
  { id: 'white', name: 'Белый', hex: '#FFFFFF' },
  { id: 'black', name: 'Чёрный', hex: '#1A1A1A' },
  { id: 'gray', name: 'Серый', hex: '#9CA3AF' },
  { id: 'navy', name: 'Тёмно-синий', hex: '#1E3A5F' },
  { id: 'red', name: 'Красный', hex: '#DC2626' },
  { id: 'green', name: 'Зелёный', hex: '#16A34A' },
  { id: 'blue', name: 'Синий', hex: '#2563EB' },
  { id: 'sand', name: 'Песочный', hex: '#D4B896' }
]
