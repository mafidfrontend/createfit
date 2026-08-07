import type { DeliveryMethod, PaymentMethod, PromoCode } from '~/types'

export const DELIVERY_METHODS: DeliveryMethod[] = [
  {
    id: 'pickup',
    name: 'Самовывоз',
    description: 'Забрать из студии бесплатно',
    price: 0,
    icon: 'pickup',
  },
  {
    id: 'courier',
    name: 'Курьер по городу',
    description: 'Доставка в день заказа',
    price: 350,
    icon: 'courier',
  },
  {
    id: 'post',
    name: 'Почта России',
    description: 'Доставка 3–7 дней',
    price: 250,
    icon: 'post',
  },
]

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Банковская карта',
    description: 'Visa, Mastercard, МИР',
    icon: 'card',
  },
  {
    id: 'sbp',
    name: 'СБП',
    description: 'Система быстрых платежей',
    icon: 'sbp',
  },
  {
    id: 'cash',
    name: 'Наличными при получении',
    description: 'Оплата курьеру или в студии',
    icon: 'cash',
  },
]

export const PROMO_CODES: PromoCode[] = [
  {
    code: 'SAIKO10',
    discountPercent: 10,
    description: 'Скидка 10% на первый заказ',
  },
  {
    code: 'WELCOME',
    discountPercent: 15,
    description: 'Приветственный бонус 15%',
  },
]

export function getDeliveryById(id: string): DeliveryMethod | undefined {
  return DELIVERY_METHODS.find((d) => d.id === id)
}

export function getPaymentById(id: string): PaymentMethod | undefined {
  return PAYMENT_METHODS.find((p) => p.id === id)
}

export function validatePromo(code: string): PromoCode | null {
  const found = PROMO_CODES.find((p) => p.code === code.toUpperCase().trim())
  return found ?? null
}
