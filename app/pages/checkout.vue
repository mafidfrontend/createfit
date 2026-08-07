<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '~/components/AppHeader.vue'
import AppButton from '~/components/AppButton.vue'
import AppSectionHeader from '~/components/AppSectionHeader.vue'
import BrandFooter from '~/components/BrandFooter.vue'
import CheckoutItemCard from '~/components/checkout/CheckoutItemCard.vue'
import CheckoutMeasurements from '~/components/checkout/CheckoutMeasurements.vue'
import CheckoutPriceBreakdown from '~/components/checkout/CheckoutPriceBreakdown.vue'
import CheckoutDeliveryForm from '~/components/checkout/CheckoutDeliveryForm.vue'
import CheckoutDeliveryMethod from '~/components/checkout/CheckoutDeliveryMethod.vue'
import CheckoutPaymentMethod from '~/components/checkout/CheckoutPaymentMethod.vue'
import CheckoutPromoCode from '~/components/checkout/CheckoutPromoCode.vue'
import CheckoutOrderNotes from '~/components/checkout/CheckoutOrderNotes.vue'
import { useFormat } from '~/composables/useFormat'
import type { PersonalInfo } from '~/types'

const router = useRouter()
const cartStore = useCartStore()
const orderStore = useOrderStore()
const measurementsStore = useMeasurementsStore()
const { formatPrice } = useFormat()

const isEmpty = computed(() => cartStore.isEmpty)

const deliveryRequiresAddress = computed(() => orderStore.deliveryMethodId !== 'pickup')

const canPlaceOrder = computed(() => {
  if (isEmpty.value) return false
  if (!orderStore.contactInfoValid) return false
  if (!measurementsStore.confirmed) return false
  return true
})

function goBack() {
  router.push('/cart')
}

function updateContactInfo(value: PersonalInfo) {
  orderStore.contactInfo = value
}

async function placeOrder() {
  if (!canPlaceOrder.value) return
  orderStore.createOrder(cartStore.items, measurementsStore.data)
  await orderStore.placeOrder()
  cartStore.clear()
  router.push('/success')
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <AppHeader title="Оформление заказа" show-back show-menu @back="goBack" />

    <main class="flex-1 px-5 pt-4 pb-28">
      <template v-if="isEmpty">
        <div class="flex flex-col items-center justify-center py-20 text-center">
          <p class="text-sm text-neutral-500">Корзина пуста</p>
          <div class="mt-4">
            <AppButton variant="primary" @click="router.push('/create')">
              Создать дизайн
            </AppButton>
          </div>
        </div>
      </template>

      <template v-else>
        <!-- 1. Order items -->
        <div class="mb-6">
          <AppSectionHeader :number="1" title="Ваш заказ" description="Проверьте товары перед оформлением" />
          <div class="space-y-3">
            <CheckoutItemCard
              v-for="item in cartStore.items"
              :key="item.id"
              :item="item"
              @remove="cartStore.removeItem(item.id)"
              @update-quantity="cartStore.updateQuantity(item.id, $event)"
            />
          </div>
        </div>

        <!-- 2. Measurements -->
        <div v-if="measurementsStore.confirmed" class="mb-6">
          <AppSectionHeader :number="2" title="Мерки" description="Подтверждённые мерки для пошива" />
          <CheckoutMeasurements :measurements="measurementsStore.data" />
        </div>

        <!-- 3. Delivery method -->
        <div class="mb-6">
          <AppSectionHeader :number="3" title="Способ доставки" />
          <CheckoutDeliveryMethod
            :model-value="orderStore.deliveryMethodId"
            @update:model-value="orderStore.setDeliveryMethod($event)"
          />
        </div>

        <!-- 4. Delivery address -->
        <div class="mb-6">
          <AppSectionHeader :number="4" title="Адрес доставки" description="Куда доставить заказ" />
          <CheckoutDeliveryForm
            :model-value="orderStore.contactInfo"
            :delivery-requires-address="deliveryRequiresAddress"
            @update:model-value="updateContactInfo"
          />
        </div>

        <!-- 5. Payment method -->
        <div class="mb-6">
          <AppSectionHeader :number="5" title="Способ оплаты" />
          <CheckoutPaymentMethod
            :model-value="orderStore.paymentMethodId"
            @update:model-value="orderStore.setPaymentMethod($event)"
          />
        </div>

        <!-- 6. Promo code -->
        <div class="mb-6">
          <AppSectionHeader :number="6" title="Промокод" optional />
          <CheckoutPromoCode
            :model-value="orderStore.promoCode"
            :applied-promo="orderStore.appliedPromo"
            @update:model-value="orderStore.setPromoCode($event)"
            @apply="orderStore.applyPromo()"
            @remove="orderStore.removePromo()"
          />
        </div>

        <!-- 7. Order notes -->
        <div class="mb-6">
          <AppSectionHeader :number="7" title="Комментарий" optional />
          <CheckoutOrderNotes
            :model-value="orderStore.notes"
            @update:model-value="orderStore.setNotes($event)"
          />
        </div>

        <!-- 8. Price breakdown -->
        <div class="mb-6">
          <AppSectionHeader :number="8" title="Стоимость" />
          <CheckoutPriceBreakdown
            :subtotal="orderStore.subtotal"
            :delivery-price="orderStore.deliveryPrice"
            :discount="orderStore.discountAmount"
            :total="orderStore.total"
            :promo-code="orderStore.appliedPromo"
          />
        </div>

        <BrandFooter />
      </template>
    </main>

    <!-- Bottom action bar -->
    <div
      v-if="!isEmpty"
      class="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-neutral-100 bg-white/95 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md"
    >
      <div class="mb-2 flex items-center justify-between">
        <span class="text-sm text-neutral-500">Итого</span>
        <span class="text-xl font-extrabold text-primary-700">{{ formatPrice(orderStore.total) }}</span>
      </div>
      <AppButton
        variant="primary"
        size="lg"
        full-width
        :loading="orderStore.isProcessing"
        :disabled="!canPlaceOrder"
        @click="placeOrder"
      >
        {{ orderStore.isProcessing ? 'Оформляем...' : 'Оформить заказ' }}
      </AppButton>
      <p v-if="!canPlaceOrder && !isEmpty" class="mt-2 text-center text-xs text-neutral-400">
        Заполните все обязательные поля
      </p>
    </div>
  </div>
</template>
