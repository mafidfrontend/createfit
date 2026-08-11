import { DELIVERY_PRICE } from '~/config/catalog'
import type { Fabric, Product } from '~/types/order'

export function calculateSubtotal(product: Product | null, fabric: Fabric | null, designAdditionalPrice = 0): number {
  return (product?.basePrice ?? 0) + (fabric?.additionalPrice ?? 0) + designAdditionalPrice
}

export function calculateTotal(product: Product | null, fabric: Fabric | null, designAdditionalPrice = 0, deliveryPrice = DELIVERY_PRICE): number {
  return calculateSubtotal(product, fabric, designAdditionalPrice) + deliveryPrice
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(0)}`
}
