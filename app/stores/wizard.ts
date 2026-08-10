import { defineStore } from 'pinia'
import type { WizardOrder, WizardStep, SizeId, ProductId, FabricId, DesignCatalogId, PaymentStatus } from '~/types/wizard'
import { DELIVERY_PRICE, getProductById, getFabricById, getDesignById, calculateTotal } from '~/config/wizard'

interface WizardState {
  step: WizardStep
  order: WizardOrder
  isSubmitting: boolean
  isConfirmed: boolean
  submitError: string | null
}

function createEmptyOrder(): WizardOrder {
  return {
    contact: { name: '', phone: '' },
    product: null,
    fabric: null,
    design: null,
    size: null,
    delivery: { city: '', address: '', phone: '', comment: '' },
    pricing: {
      productPrice: 0,
      fabricPrice: 0,
      designPrice: 0,
      deliveryPrice: 0,
      total: 0,
    },
    payment: { status: 'pending' },
    orderNumber: null,
  }
}

export interface SubmitOrderResponse {
  success: boolean
  orderNumber?: string
  totalPrice?: number
  createdAt?: string
  error?: string
}

export const useWizardStore = defineStore('wizard', {
  persist: true,
  state: (): WizardState => ({
    step: 1,
    order: createEmptyOrder(),
    isSubmitting: false,
    isConfirmed: false,
    submitError: null,
  }),

  getters: {
    totalSteps: () => 7,

    isStepValid: (state): boolean => {
      const o = state.order
      switch (state.step) {
        case 1:
          return o.contact.name.trim() !== '' && o.contact.phone.trim() !== ''
        case 2:
          return o.product !== null
        case 3:
          return o.fabric !== null
        case 4:
          return o.design !== null
        case 5:
          return o.size !== null
        case 6:
          return o.payment.status === 'awaiting_payment' || o.payment.status === 'paid'
        case 7:
          return o.delivery.city.trim() !== '' && o.delivery.address.trim() !== '' && o.delivery.phone.trim() !== ''
        default:
          return false
      }
    },

    recalculatedOrder(): WizardOrder {
      const o = this.order
      const productPrice = o.product?.price ?? 0
      const fabricPrice = o.fabric?.price ?? 0
      const designPrice = o.design?.price ?? 0
      const deliveryPrice = o.delivery.city.trim() !== '' ? DELIVERY_PRICE : 0
      const total = calculateTotal(productPrice, fabricPrice, designPrice, deliveryPrice)
      return {
        ...o,
        pricing: { productPrice, fabricPrice, designPrice, deliveryPrice, total },
      }
    },
  },

  actions: {
    setContact(name: string, phone: string) {
      this.order.contact = { name, phone }
    },

    selectProduct(id: ProductId) {
      const product = getProductById(id)
      if (product) {
        this.order.product = { id: product.id, name: product.name, price: product.price }
        this.recalculatePricing()
      }
    },

    selectFabric(id: FabricId) {
      const fabric = getFabricById(id)
      if (fabric) {
        this.order.fabric = { id: fabric.id, name: fabric.name, price: fabric.price }
        this.recalculatePricing()
      }
    },

    selectDesign(id: DesignCatalogId) {
      const design = getDesignById(id)
      if (design) {
        this.order.design = { id: design.id, name: design.name, price: design.price, image: design.image }
        this.recalculatePricing()
      }
    },

    selectSize(size: SizeId) {
      this.order.size = size
    },

    setDeliveryField(field: 'city' | 'address' | 'phone' | 'comment', value: string) {
      this.order.delivery[field] = value
      this.recalculatePricing()
    },

    setPaymentStatus(status: PaymentStatus) {
      this.order.payment.status = status
    },

    recalculatePricing() {
      const o = this.order
      const productPrice = o.product?.price ?? 0
      const fabricPrice = o.fabric?.price ?? 0
      const designPrice = o.design?.price ?? 0
      const deliveryPrice = o.delivery.city.trim() !== '' ? DELIVERY_PRICE : 0
      o.pricing = {
        productPrice,
        fabricPrice,
        designPrice,
        deliveryPrice,
        total: calculateTotal(productPrice, fabricPrice, designPrice, deliveryPrice),
      }
    },

    nextStep() {
      if (this.step < 7) {
        this.step = (this.step + 1) as WizardStep
      }
    },

    prevStep() {
      if (this.step > 1) {
        this.step = (this.step - 1) as WizardStep
      }
    },

    goToStep(step: WizardStep) {
      this.step = step
    },

    initiatePayment() {
      this.order.payment.status = 'awaiting_payment'
    },

    async submitOrder(telegramInitData: string): Promise<SubmitOrderResponse> {
      this.isSubmitting = true
      this.submitError = null
      this.recalculatePricing()

      const o = this.order
      if (!o.product || !o.fabric || !o.design || !o.size) {
        this.isSubmitting = false
        this.submitError = 'Не все поля заполнены'
        return { success: false, error: 'Incomplete order' }
      }

      try {
        const response = await $fetch<SubmitOrderResponse>('/api/order/create', {
          method: 'POST',
          body: {
            telegramInitData,
            contact: o.contact,
            productId: o.product.id,
            fabricId: o.fabric.id,
            designId: o.design.id,
            size: o.size,
            delivery: o.delivery,
          },
        })

        if (response.success && response.orderNumber) {
          this.order.orderNumber = response.orderNumber
          this.order.pricing.total = response.totalPrice ?? this.order.pricing.total
          this.isConfirmed = true
          this.isSubmitting = false
          return response
        }

        this.submitError = response.error ?? 'Не удалось оформить заказ'
        this.isSubmitting = false
        return response
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Ошибка соединения с сервером'
        this.submitError = message
        this.isSubmitting = false
        return { success: false, error: message }
      }
    },

    reset() {
      this.step = 1
      this.order = createEmptyOrder()
      this.isSubmitting = false
      this.isConfirmed = false
      this.submitError = null
    },
  },
})
