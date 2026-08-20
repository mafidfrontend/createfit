export interface Contact {
  name: string
  phone: string
}

export interface Product {
  id: string
  name: string
  price: number
  image: string
}

export interface Fabric {
  id: string
  name: string
  description: string
  image: string
  price: number
}

export interface Design {
  id: string
  name: string
  image: string
  frontImage?: string
  backImage?: string
  price: number
  source: 'catalog' | 'ai'
}

export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'

export interface Delivery {
  city: string
  address: string
  phone: string
  comment?: string
}

export interface Pricing {
  productPrice: number
  fabricPrice: number
  designPrice: number
  deliveryPrice: number
  total: number
}

export type PaymentStatus = 'pending' | 'paid' | 'failed'

export interface Payment {
  status: PaymentStatus
}

export interface OrderState {
  contact: Contact | null
  product: Product | null
  fabric: Fabric | null
  design: Design | null
  size: Size | null
  delivery: Delivery | null
  pricing: Pricing
  payment: Payment
}
