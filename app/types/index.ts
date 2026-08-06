export type ProductId = string
export type FabricId = string

export interface ProductType {
  id: ProductId
  name: string
  slug: string
  basePrice: number
  icon: string
  sizes: string[]
}

export interface Fabric {
  id: FabricId
  name: string
  description: string
  priceModifier: number
  swatchColor: string
  icon: string
  features: string[]
}

export interface Design {
  id: string
  prompt: string
  referenceImage: string | null
  productId: ProductId
  fabricId: FabricId
  frontImage: string | null
  backImage: string | null
  createdAt: string
}

export interface Measurements {
  chest: number | null
  waist: number | null
  hip: number | null
  shoulder: number | null
  sleeve: number | null
  height: number | null
  frontPhoto: string | null
  sidePhoto: string | null
  a4Detected: boolean
  validated: boolean
}

export interface PersonalInfo {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
}

export interface CartItem {
  id: string
  productId: ProductId
  designId: string
  size: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  items: CartItem[]
  personalInfo: PersonalInfo
  measurements: Measurements
  total: number
  deliveryPrice: number
  status: 'pending' | 'paid' | 'confirmed'
  createdAt: string
}
