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
  { id: 'tshirt', name: 'Футболка', price: 25 },
  { id: 'womens-tshirt', name: 'Женская футболка', price: 28 },
  { id: 'kids-tshirt', name: 'Детская футболка', price: 18 },
  { id: 'tshirt-shorts-set', name: 'Комплект — футболка + шорты', price: 45 },
  { id: 'tracksuit', name: 'Спортивный костюм', price: 65 },
]

export const SERVER_FABRICS: ServerFabric[] = [
  { id: 'cotton', name: 'Хлопок', price: 0 },
  { id: 'polyester', name: 'Полиэстер', price: 5 },
  { id: 'linen', name: 'Лён', price: 8 },
  { id: 'blend', name: 'Микс (хлопок + полиэстер)', price: 3 },
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
