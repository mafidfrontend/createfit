export type PaymentMethod = 'click' | 'payme' | 'uzum' | 'visa'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled'
export type DesignType = 'existing' | 'uploaded' | 'ai'
export type SizeType = 'standard' | 'custom'

export interface Product { id: string; name: string; basePrice: number; description: string }
export interface Fabric { id: string; name: string; additionalPrice: number; description: string }
export interface Design {
  type: DesignType
  existingDesignId: string | null
  existingDesignName: string | null
  uploadedImageUrl: string | null
  uploadedImageName: string | null
  additionalPrice: number
  aiPrompt?: string | null
  aiStyle?: string | null
  aiColor?: string | null
  aiFrontImage?: string | null
  aiBackImage?: string | null
}
export interface CustomMeasurements { height: string; chest: string; waist: string; hips: string; length: string; sleeve: string; other: string }
export interface SizeSelection { type: SizeType; standardSize: string | null; customMeasurements: CustomMeasurements | null; aiEstimated?: boolean; aiConfidence?: number }
export interface Delivery { city: string; address: string; comment: string; price: number }
export interface Customer { telegramId: number | null; firstName: string; lastName: string; username: string | null; phone: string; countryCode?: string }
export interface OrderDraft {
  customer: Customer; product: Product | null; fabric: Fabric | null; design: Design | null; size: SizeSelection | null;
  paymentMethod: PaymentMethod | null; paymentStatus: PaymentStatus; delivery: Delivery;
  subtotal: number; deliveryPrice: number; totalPrice: number; manufacturingDays: number;
}
export interface CreatedOrder extends OrderDraft { id: string; createdAt: string; }
