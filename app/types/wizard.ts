export type ProductId = string
export type FabricId = string
export type DesignCatalogId = string
export type SizeId = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'

export const SIZES: SizeId[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export interface ProductType {
  id: ProductId
  name: string
  price: number
  image: string
  sizes: SizeId[]
}

export interface Fabric {
  id: FabricId
  name: string
  description: string
  price: number
  swatchImage: string
}

export interface CatalogDesign {
  id: DesignCatalogId
  name: string
  price: number
  image: string
}

export interface WizardContact {
  name: string
  phone: string
}

export interface WizardDelivery {
  city: string
  address: string
  phone: string
  comment: string
}

export type PaymentStatus = 'pending' | 'awaiting_payment' | 'paid' | 'failed'

export interface WizardOrder {
  contact: WizardContact
  product: { id: ProductId; name: string; price: number } | null
  fabric: { id: FabricId; name: string; price: number } | null
  design: { id: DesignCatalogId; name: string; price: number; image: string } | null
  size: SizeId | null
  delivery: WizardDelivery
  pricing: {
    productPrice: number
    fabricPrice: number
    designPrice: number
    deliveryPrice: number
    total: number
  }
  payment: {
    status: PaymentStatus
  }
  orderNumber: string | null
}

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

export const WIZARD_STEPS: { step: WizardStep; title: string }[] = [
  { step: 1, title: 'Имя / Контакт' },
  { step: 2, title: 'Выбор изделия' },
  { step: 3, title: 'Выбор ткани' },
  { step: 4, title: 'Дизайн изделия' },
  { step: 5, title: 'Размер' },
  { step: 6, title: 'Оплата' },
  { step: 7, title: 'Доставка' },
]

export const MANUFACTURING_DAYS = 7
