import { defineStore } from 'pinia'
import { DELIVERY_PRICE, MANUFACTURING_DAYS } from '~/config/catalog'
import { calculateSubtotal, calculateTotal } from '~/utils/pricing'
import type { CreatedOrder, Customer, Delivery, Design, Fabric, OrderDraft, PaymentMethod, Product, SizeSelection } from '~/types/order'

const emptyCustomer: Customer = { telegramId: null, firstName: '', lastName: '', username: null, phone: '', countryCode: '+998' }
const emptyDelivery: Delivery = { city: '', address: '', comment: '', price: DELIVERY_PRICE }

export const useOrderStore = defineStore('createfit-order', {
  state: (): { draft: OrderDraft; createdOrder: CreatedOrder | null; error: string } => ({
    draft: { customer: { ...emptyCustomer }, product: null, fabric: null, design: null, size: null, paymentMethod: null, paymentStatus: 'pending', delivery: { ...emptyDelivery }, subtotal: 0, deliveryPrice: DELIVERY_PRICE, totalPrice: DELIVERY_PRICE, manufacturingDays: MANUFACTURING_DAYS },
    createdOrder: null,
    error: ''
  }),
  getters: {
    hasContact: (state) => Boolean(state.draft.customer.phone),
    hasSize: (state) => Boolean(state.draft.size?.type === 'standard' ? state.draft.size.standardSize : state.draft.size?.customMeasurements?.height && state.draft.size.customMeasurements.chest),
    displayName: (state) => state.draft.customer.firstName || (state.draft.customer.username ? `@${state.draft.customer.username}` : 'Ваш профиль')
  },
  actions: {
    setCustomer(customer: Partial<Customer>): void { this.draft.customer = { ...this.draft.customer, ...customer } },
    setProduct(product: Product): void { this.draft.product = product; this.recalculate() },
    setFabric(fabric: Fabric): void { this.draft.fabric = fabric; this.recalculate() },
    setDesign(design: Design): void { this.draft.design = design; this.recalculate() },
    setSize(size: SizeSelection): void { this.draft.size = size },
    setPaymentMethod(method: PaymentMethod): void { this.draft.paymentMethod = method },
    setDelivery(delivery: Partial<Delivery>): void { this.draft.delivery = { ...this.draft.delivery, ...delivery }; this.recalculate() },
    recalculate(): void { this.draft.subtotal = calculateSubtotal(this.draft.product, this.draft.fabric, this.draft.design?.additionalPrice ?? 0); this.draft.deliveryPrice = this.draft.delivery.price; this.draft.totalPrice = calculateTotal(this.draft.product, this.draft.fabric, this.draft.design?.additionalPrice ?? 0, this.draft.delivery.price) },
    setCreatedOrder(order: CreatedOrder): void { this.createdOrder = order },
    reset(): void { this.$reset() }
  },
  persist: true
})
