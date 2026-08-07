<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '~/components/AppHeader.vue'
import AppButton from '~/components/AppButton.vue'
import BottomNav from '~/components/BottomNav.vue'
import BrandFooter from '~/components/BrandFooter.vue'
import CheckoutItemCard from '~/components/checkout/CheckoutItemCard.vue'
import { useFormat } from '~/composables/useFormat'

const router = useRouter()
const cartStore = useCartStore()
const { formatPrice } = useFormat()

const isEmpty = computed(() => cartStore.isEmpty)

function goToCreate() {
  router.push('/create')
}

function goToCheckout() {
  router.push('/checkout')
}

function removeItem(id: string) {
  cartStore.removeItem(id)
}

function updateQuantity(id: string, quantity: number) {
  cartStore.updateQuantity(id, quantity)
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <AppHeader title="Корзина" show-back show-menu @back="router.push('/')" />

    <main class="flex-1 px-5 pt-4 pb-20">
      <template v-if="isEmpty">
        <div class="flex flex-col items-center justify-center py-20 text-center">
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
            <svg class="h-10 w-10 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 7h12l1 13H5L6 7zM9 7V5a3 3 0 016 0v2" />
            </svg>
          </div>
          <h2 class="mt-4 text-lg font-bold text-neutral-900">Корзина пуста</h2>
          <p class="mt-1 text-sm text-neutral-500">Создайте свой первый дизайн</p>
          <div class="mt-6">
            <AppButton variant="primary" size="lg" @click="goToCreate">
              Создать дизайн
            </AppButton>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="space-y-3">
          <CheckoutItemCard
            v-for="item in cartStore.items"
            :key="item.id"
            :item="item"
            @remove="removeItem(item.id)"
            @update-quantity="updateQuantity(item.id, $event)"
          />
        </div>

        <div class="mt-4 flex items-center justify-between rounded-2xl bg-neutral-50 px-5 py-4">
          <span class="text-sm font-medium text-neutral-500">Итого</span>
          <span class="text-xl font-extrabold text-primary-700">{{ formatPrice(cartStore.totalPrice) }}</span>
        </div>

        <div class="mt-6">
          <AppButton variant="primary" size="lg" full-width @click="goToCheckout">
            Оформить заказ
          </AppButton>
        </div>

        <BrandFooter />
      </template>
    </main>

    <BottomNav />
  </div>
</template>
