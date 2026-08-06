import { defineStore } from 'pinia'
import type { Order, CartItem, PersonalInfo, Measurements } from '~/types'

interface OrderState {
  current: Order | null
  history: Order[]
  isProcessing: boolean
  deliveryPrice: number
}

export const useOrderStore = defineStore('order', {
  state: (): OrderState => ({
    current: null,
    history: [],
    isProcessing: false,
    deliveryPrice: 350,
  }),

  getters: {
    subtotal(): number {
      if (!this.current) return 0
      return this.current.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    },
    total(): number {
      return this.subtotal + this.deliveryPrice
    },
  },

  actions: {
    createOrder(
      items: CartItem[],
      personalInfo: PersonalInfo,
      measurements: Measurements,
    ) {
      const itemTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      this.current = {
        id: crypto.randomUUID(),
        items,
        personalInfo,
        measurements,
        total: itemTotal + this.deliveryPrice,
        deliveryPrice: this.deliveryPrice,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
    },

    setProcessing(value: boolean) {
      this.isProcessing = value
    },

    markAsPaid() {
      if (this.current) {
        this.current.status = 'paid'
      }
    },

    confirmOrder() {
      if (this.current) {
        this.current.status = 'confirmed'
        this.history.push(this.current)
      }
    },

    clearCurrent() {
      this.current = null
    },
  },
})
