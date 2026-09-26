export interface DesignResolutionInput {
  designType?: string
  designId: string
  designName?: string | null
}

export interface PredefinedDesignRow {
  id: string
  slug: string
  name: string
  price: number
}

export interface ResolvedOrderDesign {
  catalogId: string | null
  slug: string
  name: string
  price: number
}

// Pure design resolution: the client only supplies a type/id/name hint. A
// predefined design must come from an active `designs` row or be rejected.
// AI/uploaded designs never require or receive a predefined catalog row.
export function resolveOrderDesign(
  input: DesignResolutionInput,
  predefinedDesign: PredefinedDesignRow | null,
): ResolvedOrderDesign | undefined {
  if (input.designType === 'existing') {
    if (!predefinedDesign) return undefined
    return {
      catalogId: predefinedDesign.id,
      slug: predefinedDesign.slug,
      name: predefinedDesign.name,
      price: predefinedDesign.price,
    }
  }

  if (input.designType === 'ai' || input.designType === 'uploaded') {
    return {
      catalogId: null,
      slug: input.designId || input.designType,
      name: input.designName || (input.designType === 'ai' ? 'AI-дизайн' : 'Загруженный дизайн'),
      price: 0,
    }
  }

  return undefined
}

export interface ResolvedOrderPricing {
  productPrice: number
  fabricPrice: number
  designPrice: number
  deliveryPrice: number
  totalPrice: number
}

// Pure pricing calculation from already-resolved catalog/settings values.
// This signature has no client-supplied price field, so a client price can
// never reach the total by construction.
export function calculateOrderPricing(
  product: { price: number },
  fabric: { additionalPrice: number },
  design: { price: number },
  settings: { delivery_price: number },
): ResolvedOrderPricing {
  const productPrice = product.price
  const fabricPrice = fabric.additionalPrice
  const designPrice = design.price
  const deliveryPrice = settings.delivery_price
  return {
    productPrice,
    fabricPrice,
    designPrice,
    deliveryPrice,
    totalPrice: productPrice + fabricPrice + designPrice + deliveryPrice,
  }
}
