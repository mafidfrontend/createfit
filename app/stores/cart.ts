import { defineStore } from 'pinia'
import type { CartItem } from '~/types'

interface CartState {
  items: CartItem[]
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    items: [],
  }),

  getters: {
    totalCount: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: (state) => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    isEmpty: (state) => state.items.length === 0,
  },

  actions: {
    hasItem(id: string): boolean {
      return this.items.some((item) => item.id === id)
    },

    getItemById(id: string): CartItem | undefined {
      return this.items.find((item) => item.id === id)
    },

    addItem(item: Omit<CartItem, 'id'>) {
      const existing = this.items.find(
        (i) => i.productId === item.productId && i.designId === item.designId && i.size === item.size,
      )
      if (existing) {
        existing.quantity += item.quantity
      } else {
        this.items.push({ ...item, id: crypto.randomUUID() })
      }
    },

    removeItem(id: string) {
      const index = this.items.findIndex((item) => item.id === id)
      if (index !== -1) {
        this.items.splice(index, 1)
      }
    },

    updateQuantity(id: string, quantity: number) {
      const item = this.getItemById(id)
      if (item) {
        if (quantity <= 0) {
          this.removeItem(id)
        } else {
          item.quantity = quantity
        }
      }
    },

    clear() {
      this.items = []
    },
  },
})
