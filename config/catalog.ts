import type { Fabric, Product } from '~/types/order'

export const PRODUCTS: Product[] = [
  { id: 'tee', name: 'Футболка', basePrice: 25, description: 'Свободная посадка на каждый день' },
  { id: 'women-tee', name: 'Женская футболка', basePrice: 25, description: 'Актуальный силуэт с комфортной посадкой' },
  { id: 'kids-tee', name: 'Детская футболка', basePrice: 20, description: 'Мягкая и удобная для активных дней' },
  { id: 'set', name: 'Комплект — футболка и шорты', basePrice: 42, description: 'Готовый комплект для движения' },
  { id: 'tracksuit', name: 'Спортивный костюм', basePrice: 65, description: 'Полный образ для спорта и отдыха' }
]

export const FABRICS: Fabric[] = [
  { id: 'cotton', name: 'Хлопок', additionalPrice: 0, description: 'Дышащий и мягкий материал' },
  { id: 'premium-cotton', name: 'Премиум-хлопок', additionalPrice: 5, description: 'Плотнее, мягче, дольше служит' },
  { id: 'sport', name: 'Спортивная ткань', additionalPrice: 8, description: 'Лёгкая, эластичная, быстро сохнет' },
  { id: 'fleece', name: 'Флис', additionalPrice: 10, description: 'Тёплый вариант для костюма' }
]

export const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
export const DELIVERY_PRICE = 5
export const MANUFACTURING_DAYS = 7
export const EXISTING_DESIGNS = [
  { id: 'mono', name: 'Mono Line', accent: '#d7e5db' },
  { id: 'terra', name: 'Terracotta', accent: '#e9c1b1' },
  { id: 'wave', name: 'Soft Wave', accent: '#c8d9e1' }
]
