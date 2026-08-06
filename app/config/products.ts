import type { ProductType, Fabric } from '~/types'

export const PRODUCTS: ProductType[] = [
  {
    id: 'tshirt',
    name: 'Футболка',
    slug: 'tshirt',
    basePrice: 1490,
    icon: 'tshirt',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'hoodie',
    name: 'Худи',
    slug: 'hoodie',
    basePrice: 2990,
    icon: 'hoodie',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'polo',
    name: 'Поло',
    slug: 'polo',
    basePrice: 1990,
    icon: 'polo',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'longsleeve',
    name: 'Лонгслив',
    slug: 'longsleeve',
    basePrice: 1790,
    icon: 'longsleeve',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
]

export const FABRICS: Fabric[] = [
  {
    id: 'cotton',
    name: 'Хлопок',
    description: 'Мягкий и приятный к телу',
    priceModifier: 0,
    swatchColor: '#f9fafb',
    icon: 'cotton',
    features: [
      'Мягкий и приятный к телу',
      'Хорошо пропускает воздух',
      'Для повседневной носки',
    ],
  },
  {
    id: 'polyester',
    name: 'Спорт – полиэстер',
    description: 'Лёгкий и прочный',
    priceModifier: 200,
    swatchColor: '#e5e7eb',
    icon: 'polyester',
    features: [
      'Лёгкий и прочный',
      'Быстро сохнет',
      'Отводит влагу',
      'Для тренировок и спорта',
    ],
  },
  {
    id: 'linen',
    name: 'Лён',
    description: 'Натуральный и дышащий',
    priceModifier: 400,
    swatchColor: '#d6d3d1',
    icon: 'linen',
    features: [
      'Натуральный материал',
      'Отлично дышит',
      'Прохладный в жару',
      'Гипоаллергенный',
    ],
  },
  {
    id: 'blend',
    name: 'Микс (хлопок + полиэстер)',
    description: 'Лучшее из двух материалов',
    priceModifier: 300,
    swatchColor: '#cbd5e1',
    icon: 'blend',
    features: [
      'Устойчив к деформации',
      'Сохраняет форму',
      'Универсальный вариант',
      'Износостойкий',
    ],
  },
]

export function getProductById(id: string): ProductType | undefined {
  return PRODUCTS.find((p) => p.id === id)
}

export function getFabricById(id: string): Fabric | undefined {
  return FABRICS.find((f) => f.id === id)
}

export function calculatePrice(productId: string, fabricId: string): number {
  const product = getProductById(productId)
  const fabric = getFabricById(fabricId)
  if (!product || !fabric) return 0
  return product.basePrice + fabric.priceModifier
}
