import { defineStore } from 'pinia'
import type {
  Order,
  CartItem,
  PersonalInfo,
  Measurements,
  DeliveryMethodId,
  PaymentMethodId,
} from '~/types'
import { DELIVERY_METHODS, validatePromo } from '~/config/checkout'

interface OrderState {
  current: Order | null
  history: Order[]
  isProcessing: boolean
  isConfirmed: boolean
  deliveryMethodId: DeliveryMethodId
  paymentMethodId: PaymentMethodId
  promoCode: string
  appliedPromo: string | null
  discount: number
  notes: string
  contactInfo: PersonalInfo
}

const defaultContactInfo: PersonalInfo = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
}

export const useOrderStore = defineStore('order', {
  state: (): OrderState => ({
    current: null,
    history: [],
    isProcessing: false,
    isConfirmed: false,
    deliveryMethodId: 'courier',
    paymentMethodId: 'card',
    promoCode: '',
    appliedPromo: null,
    discount: 0,
    notes: '',
    contactInfo: { ...defaultContactInfo },
  }),

  getters: {
    deliveryMethod: (state) => {
      return DELIVERY_METHODS.find((d) => d.id === state.deliveryMethodId) ?? DELIVERY_METHODS[1]
    },

    deliveryPrice(): number {
      return this.deliveryMethod.price
    },

    subtotal(): number {
      if (!this.current) return 0
      return this.current.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    },

    discountAmount(): number {
      return Math.round((this.subtotal * this.discount) / 100)
    },

    total(): number {
      return Math.max(0, this.subtotal - this.discountAmount) + this.deliveryPrice
    },

    contactInfoValid: (state): boolean => {
      const { fullName, phone, address, city, postalCode } = state.contactInfo
      return (
        fullName.trim() !== '' &&
        phone.trim() !== '' &&
        address.trim() !== '' &&
        city.trim() !== '' &&
        postalCode.trim() !== ''
      )
    },
  },

  actions: {
    setDeliveryMethod(id: DeliveryMethodId) {
      this.deliveryMethodId = id
    },

    setPaymentMethod(id: PaymentMethodId) {
      this.paymentMethodId = id
    },

    setPromoCode(code: string) {
      this.promoCode = code
    },

    applyPromo(): boolean {
      const promo = validatePromo(this.promoCode)
      if (promo) {
        this.appliedPromo = promo.code
        this.discount = promo.discountPercent
        return true
      }
      this.appliedPromo = null
      this.discount = 0
      return false
    },

    removePromo() {
      this.promoCode = ''
      this.appliedPromo = null
      this.discount = 0
    },

    setNotes(notes: string) {
      this.notes = notes
    },

    updateContactInfo(field: keyof PersonalInfo, value: string) {
      this.contactInfo[field] = value
    },

    createOrder(items: CartItem[], measurements: Measurements) {
      this.current = {
        id: crypto.randomUUID(),
        items,
        personalInfo: { ...this.contactInfo },
        measurements,
        total: this.total,
        deliveryPrice: this.deliveryPrice,
        deliveryMethod: this.deliveryMethodId,
        paymentMethod: this.paymentMethodId,
        promoCode: this.appliedPromo,
        discount: this.discountAmount,
        notes: this.notes,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
    },

    async placeOrder(): Promise<void> {
      this.isProcessing = true
      await new Promise((resolve) => setTimeout(resolve, 2000))
      this.isProcessing = false
      this.isConfirmed = true
      if (this.current) {
        this.current.status = 'confirmed'
        this.history.push({ ...this.current })
      }
    },

    reset() {
      this.current = null
      this.isProcessing = false
      this.isConfirmed = false
      this.promoCode = ''
      this.appliedPromo = null
      this.discount = 0
      this.notes = ''
      this.contactInfo = { ...defaultContactInfo }
    },
  },
})
