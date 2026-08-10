import type { ProductType, Fabric, CatalogDesign } from '~/types/wizard'

export const PRODUCTS: ProductType[] = [
  {
    id: 'tshirt',
    name: 'Футболка',
    price: 25,
    image: 'https://images.pexels.com/photos/8146450/pexels-photo-8146450.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'womens-tshirt',
    name: 'Женская футболка',
    price: 28,
    image: 'https://images.pexels.com/photos/5996939/pexels-photo-5996939.png?auto=compress&cs=tinysrgb&h=650&w=940',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'kids-tshirt',
    name: 'Детская футболка',
    price: 18,
    image: 'https://images.pexels.com/photos/5693888/pexels-photo-5693888.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'tshirt-shorts-set',
    name: 'Комплект — футболка + шорты',
    price: 45,
    image: 'https://images.pexels.com/photos/7157062/pexels-photo-7157062.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'tracksuit',
    name: 'Спортивный костюм',
    price: 65,
    image: 'https://images.pexels.com/photos/13897451/pexels-photo-13897451.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
]

export const FABRICS: Fabric[] = [
  {
    id: 'cotton',
    name: 'Хлопок',
    description: 'Мягкий и приятный к телу, хорошо пропускает воздух',
    price: 0,
    swatchImage: 'https://images.pexels.com/photos/31034512/pexels-photo-31034512.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 'polyester',
    name: 'Полиэстер',
    description: 'Лёгкий и прочный, быстро сохнет, отводит влагу',
    price: 5,
    swatchImage: 'https://images.pexels.com/photos/11255285/pexels-photo-11255285.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 'linen',
    name: 'Лён',
    description: 'Натуральный и дышащий, прохладный в жару',
    price: 8,
    swatchImage: 'https://images.pexels.com/photos/37661410/pexels-photo-37661410.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 'blend',
    name: 'Микс (хлопок + полиэстер)',
    description: 'Устойчив к деформации, сохраняет форму',
    price: 3,
    swatchImage: 'https://images.pexels.com/photos/11255285/pexels-photo-11255285.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
]

export const CATALOG_DESIGNS: CatalogDesign[] = [
  {
    id: 'street-floral',
    name: 'Флористика',
    price: 15,
    image: 'https://images.pexels.com/photos/9951800/pexels-photo-9951800.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 'butterfly',
    name: 'Бабочка',
    price: 12,
    image: 'https://images.pexels.com/photos/19461510/pexels-photo-19461510.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 'geometric',
    name: 'Геометрия',
    price: 14,
    image: 'https://images.pexels.com/photos/13312401/pexels-photo-13312401.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 'minimal-star',
    name: 'Минимализм — Звёзды',
    price: 10,
    image: 'https://images.pexels.com/photos/16276175/pexels-photo-16276175.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 'abstract-wave',
    name: 'Абстракция — Волна',
    price: 13,
    image: 'https://images.pexels.com/photos/8168570/pexels-photo-8168570.png?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 'typography-love',
    name: 'Типографика — Love',
    price: 11,
    image: 'https://images.pexels.com/photos/6288350/pexels-photo-6288350.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
]

export const DELIVERY_PRICE = 10

export function getProductById(id: string): ProductType | undefined {
  return PRODUCTS.find((p) => p.id === id)
}

export function getFabricById(id: string): Fabric | undefined {
  return FABRICS.find((f) => f.id === id)
}

export function getDesignById(id: string): CatalogDesign | undefined {
  return CATALOG_DESIGNS.find((d) => d.id === id)
}

export function calculateTotal(
  productPrice: number,
  fabricPrice: number,
  designPrice: number,
  deliveryPrice: number,
): number {
  return productPrice + fabricPrice + designPrice + deliveryPrice
}
