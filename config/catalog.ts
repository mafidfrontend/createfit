import type { Fabric, Product } from '~/types/order'

export const PRODUCTS: Product[] = [
  { id: 'tee', name: 'Футболка', basePrice: 25, description: 'Свободная посадка на каждый день' },
  { id: 'women-tee', name: 'Женская футболка', basePrice: 25, description: 'Актуальный силуэт с комфортной посадкой' },
  { id: 'kids-tee', name: 'Детская футболка', basePrice: 25, description: 'Мягкая и удобная для активных дней' },
  { id: 'set', name: 'Комплект — футболка и шорты', basePrice: 35, description: 'Готовый комплект для движения' },
  { id: 'tracksuit', name: 'Спортивный костюм', basePrice: 50, description: 'Полный образ для спорта и отдыха' }
]

export const FABRICS: Fabric[] = [
  { id: 'cotton', name: 'Хлопок', additionalPrice: 25, description: 'Дышащий и мягкий материал' },
  { id: 'sport', name: 'Спортивная ткань', additionalPrice: 30, description: 'Лёгкая, эластичная, быстро сохнет' },
]

export const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
export const DELIVERY_PRICE = 10
export const MANUFACTURING_DAYS = 7
