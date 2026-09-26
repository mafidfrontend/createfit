import { createHash } from 'node:crypto'

export const IDEMPOTENCY_KEY_MIN_LENGTH = 16
export const IDEMPOTENCY_KEY_MAX_LENGTH = 128

export interface OrderRequestFingerprintInput {
  contact: { name: string; phone: string }
  productId: string
  fabricId: string
  designId: string
  designType?: string
  designName?: string | null
  aiFrontImage?: string | null
  uploadedImageUrl?: string | null
  size: string
  delivery: { city: string; address: string; phone: string; comment: string }
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim()
}

export function isValidIdempotencyKey(key: string): boolean {
  return key.length >= IDEMPOTENCY_KEY_MIN_LENGTH
    && key.length <= IDEMPOTENCY_KEY_MAX_LENGTH
    && /^[A-Za-z0-9._:-]+$/.test(key)
}

export function hashOrderRequest(input: OrderRequestFingerprintInput): string {
  const canonical = {
    contact: {
      name: normalize(input.contact.name),
      phone: normalize(input.contact.phone),
    },
    productId: normalize(input.productId),
    fabricId: normalize(input.fabricId),
    designId: normalize(input.designId),
    designType: normalize(input.designType),
    designName: normalize(input.designName),
    aiFrontImage: normalize(input.aiFrontImage),
    uploadedImageUrl: normalize(input.uploadedImageUrl),
    size: normalize(input.size),
    delivery: {
      city: normalize(input.delivery.city),
      address: normalize(input.delivery.address),
      phone: normalize(input.delivery.phone),
      comment: normalize(input.delivery.comment),
    },
  }

  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex')
}
