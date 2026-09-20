export interface ServerProduct {
  id: string
  name: string
  price: number
}

export interface ServerFabric {
  id: string
  name: string
  price: number
}

export interface ServerDesign {
  id: string
  name: string
  price: number
}

export const SERVER_PRODUCTS: ServerProduct[] = [
  { id: 'tee', name: 'Футболка', price: 25 },
  { id: 'women-tee', name: 'Женская футболка', price: 25 },
  { id: 'kids-tee', name: 'Детская футболка', price: 25 },
  { id: 'set', name: 'Комплект — футболка и шорты', price: 35 },
  { id: 'tracksuit', name: 'Спортивный костюм', price: 50 },
]

export const SERVER_FABRICS: ServerFabric[] = [
  { id: 'cotton', name: 'Хлопок', price: 25 },
  { id: 'sport', name: 'Спортивная ткань', price: 30 },
]

export const SERVER_DESIGNS: ServerDesign[] = [
  { id: 'street-floral', name: 'Флористика', price: 15 },
  { id: 'butterfly', name: 'Бабочка', price: 12 },
  { id: 'geometric', name: 'Геометрия', price: 14 },
  { id: 'minimal-star', name: 'Минимализм — Звёзды', price: 10 },
  { id: 'abstract-wave', name: 'Абстракция — Волна', price: 13 },
  { id: 'typography-love', name: 'Типографика — Love', price: 11 },
]

export const SERVER_DELIVERY_PRICE = 10
export const SERVER_MANUFACTURING_DAYS = 7

const productMap = new Map(SERVER_PRODUCTS.map((p) => [p.id, p]))
const fabricMap = new Map(SERVER_FABRICS.map((f) => [f.id, f]))
const designMap = new Map(SERVER_DESIGNS.map((d) => [d.id, d]))

export function getServerProduct(id: string): ServerProduct | undefined {
  return productMap.get(id)
}

export function getServerFabric(id: string): ServerFabric | undefined {
  return fabricMap.get(id)
}

export function getServerDesign(id: string): ServerDesign | undefined {
  return designMap.get(id)
}

export function calculateServerTotal(
  productPrice: number,
  fabricPrice: number,
  designPrice: number,
  deliveryPrice: number,
): number {
  return productPrice + fabricPrice + designPrice + deliveryPrice
}
