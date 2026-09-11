import type { Product, Fabric } from '~/app/types/order'

export const products: Product[] = [
  {
    id: 'tshirt-mens',
    name: 'Футболка',
    price: 25,
    image: '/images/products/tshirt-mens.jpg'
  },
  {
    id: 'tshirt-womens',
    name: 'Женская футболка',
    price: 25,
    image: '/images/products/tshirt-womens.jpg'
  },
  {
    id: 'tshirt-kids',
    name: 'Детская футболка',
    price: 20,
    image: '/images/products/tshirt-kids.jpg'
  },
  {
    id: 'set-tshirt-shorts',
    name: 'Комплект — футболка + шорты',
    price: 45,
    image: '/images/products/set-tshirt-shorts.jpg'
  },
  {
    id: 'tracksuit',
    name: 'Спортивный костюм',
    price: 75,
    image: '/images/products/tracksuit.jpg'
  }
]

export const fabrics: Fabric[] = [
  {
    id: 'cotton-basic',
    name: 'Базовый хлопок',
    description: 'Мягкий и дышащий материал',
    image: '/images/fabrics/cotton-basic.jpg',
    price: 0
  },
  {
    id: 'polyester-sport',
    name: 'Спортивный полиэстер',
    description: 'Влагоотводящий материал',
    image: '/images/fabrics/polyester-sport.jpg',
    price: 7
  },
  {
    id: 'cotton-poly-blend',
    name: 'Хлопок-полиэстер',
    description: 'Прочная смесовая ткань',
    image: '/images/fabrics/cotton-poly-blend.jpg',
    price: 3
  }
]
