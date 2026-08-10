<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTelegram } from '~/composables/useTelegram'
import { useWizardStore } from '~/stores/wizard'
import { WIZARD_STEPS, MANUFACTURING_DAYS } from '~/types/wizard'
import type { WizardStep } from '~/types/wizard'
import { PRODUCTS, FABRICS, CATALOG_DESIGNS } from '~/config/wizard'
import { useFormat } from '~/composables/useFormat'

const router = useRouter()
const wizard = useWizardStore()
const { haptic, getInitData, getTelegramUser } = useTelegram()
const { formatPrice } = useFormat()

onMounted(() => {
  if (!wizard.order.contact.name) {
    const tgUser = getTelegramUser()
    if (tgUser?.first_name) {
      const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')
      wizard.setContact(fullName, wizard.order.contact.phone)
    }
  }
})

const stepTitle = computed(() => {
  const found = WIZARD_STEPS.find((s) => s.step === wizard.step)
  return found?.title ?? ''
})

const isFirstStep = computed(() => wizard.step === 1)
const isLastStep = computed(() => wizard.step === 7)

function goBack() {
  haptic('light')
  if (wizard.step > 1) {
    wizard.prevStep()
  } else {
    router.push('/')
  }
}

function goNext() {
  if (!wizard.isStepValid) return
  haptic('medium')
  wizard.recalculatePricing()
  wizard.nextStep()
}

async function handleOrderSubmit() {
  if (!wizard.isStepValid) return
  haptic('heavy')
  const initData = getInitData()
  const result = await wizard.submitOrder(initData)
  if (result.success) {
    router.push('/order/success')
  }
}

function handlePayment() {
  haptic('medium')
  wizard.initiatePayment()
  const tg = window.Telegram?.WebApp
  if (tg) {
    tg.sendData(JSON.stringify({
      type: 'payment_request',
      amount: wizard.order.pricing.total,
    }))
  }
}

const computedOrder = computed(() => wizard.recalculatedOrder)
</script>

<template>
  <div class="flex flex-1 flex-col">
    <!-- Header -->
    <div class="sticky top-0 z-10 border-b border-neutral-100 bg-white">
      <div class="flex items-center justify-between px-5 py-4">
        <button
          class="flex items-center gap-1 text-sm font-medium text-neutral-600 transition-opacity active:opacity-60"
          @click="goBack"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Назад
        </button>
        <span class="text-sm font-bold text-neutral-900">{{ wizard.step }} / 7</span>
        <span class="w-14" />
      </div>
      <!-- Progress bar -->
      <div class="flex gap-1 px-5 pb-3">
        <div
          v-for="s in 7"
          :key="s"
          class="h-1 flex-1 rounded-full transition-colors duration-300"
          :class="wizard.step >= s ? 'bg-neutral-900' : 'bg-neutral-200'"
        />
      </div>
    </div>

    <!-- Content -->
    <main class="flex-1 overflow-y-auto px-5 pt-5 pb-28">
      <h2 class="text-xl font-extrabold text-neutral-900">{{ stepTitle }}</h2>

      <!-- STEP 1: Contact -->
      <div v-if="wizard.step === 1" class="mt-5 space-y-4">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-neutral-700">Имя</label>
          <input
            :value="wizard.order.contact.name"
            type="text"
            placeholder="Введите ваше имя"
            class="w-full rounded-xl border border-neutral-200 px-4 py-3.5 text-base text-neutral-900 outline-none transition-colors focus:border-neutral-900"
            @input="wizard.setContact(($event.target as HTMLInputElement).value, wizard.order.contact.phone)"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-neutral-700">Телефон</label>
          <input
            :value="wizard.order.contact.phone"
            type="tel"
            inputmode="tel"
            placeholder="+998 90 123 45 67"
            class="w-full rounded-xl border border-neutral-200 px-4 py-3.5 text-base text-neutral-900 outline-none transition-colors focus:border-neutral-900"
            @input="wizard.setContact(wizard.order.contact.name, ($event.target as HTMLInputElement).value)"
          />
        </div>
        <p v-if="wizard.submitError" class="text-sm font-medium text-error-600">{{ wizard.submitError }}</p>
      </div>

      <!-- STEP 2: Product -->
      <div v-else-if="wizard.step === 2" class="mt-5 space-y-3">
        <button
          v-for="product in PRODUCTS"
          :key="product.id"
          class="flex w-full items-center gap-4 rounded-2xl border-2 p-3 text-left transition-colors"
          :class="wizard.order.product?.id === product.id ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'"
          @click="wizard.selectProduct(product.id); haptic('light')"
        >
          <img :src="product.image" :alt="product.name" class="h-16 w-16 flex-shrink-0 rounded-xl object-cover" />
          <div class="flex-1">
            <p class="text-sm font-semibold text-neutral-900">{{ product.name }}</p>
            <p class="mt-0.5 text-sm font-bold text-neutral-700">{{ formatPrice(product.price) }}</p>
          </div>
          <div
            class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors"
            :class="wizard.order.product?.id === product.id ? 'border-neutral-900 bg-neutral-900' : 'border-neutral-300'"
          >
            <svg v-if="wizard.order.product?.id === product.id" class="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </button>
      </div>

      <!-- STEP 3: Fabric -->
      <div v-else-if="wizard.step === 3" class="mt-5 space-y-3">
        <button
          v-for="fabric in FABRICS"
          :key="fabric.id"
          class="flex w-full items-center gap-4 rounded-2xl border-2 p-3 text-left transition-colors"
          :class="wizard.order.fabric?.id === fabric.id ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'"
          @click="wizard.selectFabric(fabric.id); haptic('light')"
        >
          <img :src="fabric.swatchImage" :alt="fabric.name" class="h-16 w-16 flex-shrink-0 rounded-xl object-cover" />
          <div class="flex-1">
            <p class="text-sm font-semibold text-neutral-900">{{ fabric.name }}</p>
            <p class="mt-0.5 text-xs text-neutral-500">{{ fabric.description }}</p>
            <p v-if="fabric.price > 0" class="mt-1 text-sm font-bold text-neutral-700">+{{ formatPrice(fabric.price) }}</p>
            <p v-else class="mt-1 text-xs font-medium text-success-600">Без доплаты</p>
          </div>
          <div
            class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors"
            :class="wizard.order.fabric?.id === fabric.id ? 'border-neutral-900 bg-neutral-900' : 'border-neutral-300'"
          >
            <svg v-if="wizard.order.fabric?.id === fabric.id" class="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </button>
      </div>

      <!-- STEP 4: Design -->
      <div v-else-if="wizard.step === 4" class="mt-5 space-y-3">
        <p class="mb-3 text-xs text-neutral-500">Выберите готовый дизайн из каталога. AI-генерация будет доступна позже.</p>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="design in CATALOG_DESIGNS"
            :key="design.id"
            class="overflow-hidden rounded-2xl border-2 text-left transition-colors"
            :class="wizard.order.design?.id === design.id ? 'border-neutral-900' : 'border-neutral-200'"
            @click="wizard.selectDesign(design.id); haptic('light')"
          >
            <img :src="design.image" :alt="design.name" class="h-32 w-full object-cover" />
            <div class="p-3">
              <p class="text-sm font-semibold text-neutral-900">{{ design.name }}</p>
              <p class="mt-0.5 text-sm font-bold text-neutral-700">{{ formatPrice(design.price) }}</p>
            </div>
          </button>
        </div>
      </div>

      <!-- STEP 5: Size -->
      <div v-else-if="wizard.step === 5" class="mt-5">
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="size in ['XS', 'S', 'M', 'L', 'XL', 'XXL']"
            :key="size"
            class="flex h-16 items-center justify-center rounded-2xl border-2 text-lg font-bold transition-colors"
            :class="wizard.order.size === size ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-700'"
            @click="wizard.selectSize(size as any); haptic('light')"
          >
            {{ size }}
          </button>
        </div>
      </div>

      <!-- STEP 6: Payment -->
      <div v-else-if="wizard.step === 6" class="mt-5">
        <div class="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 class="text-sm font-bold text-neutral-900">Итог заказа</h3>
          <div class="mt-4 space-y-2.5">
            <div class="flex justify-between text-sm">
              <span class="text-neutral-500">Имя</span>
              <span class="font-medium text-neutral-900">{{ computedOrder.contact.name }}</span>
            </div>
            <div v-if="computedOrder.product" class="flex justify-between text-sm">
              <span class="text-neutral-500">Изделие</span>
              <span class="font-medium text-neutral-900">{{ computedOrder.product.name }}</span>
            </div>
            <div v-if="computedOrder.fabric" class="flex justify-between text-sm">
              <span class="text-neutral-500">Ткань</span>
              <span class="font-medium text-neutral-900">{{ computedOrder.fabric.name }}</span>
            </div>
            <div v-if="computedOrder.design" class="flex justify-between text-sm">
              <span class="text-neutral-500">Дизайн</span>
              <span class="font-medium text-neutral-900">{{ computedOrder.design.name }}</span>
            </div>
            <div v-if="computedOrder.size" class="flex justify-between text-sm">
              <span class="text-neutral-500">Размер</span>
              <span class="font-medium text-neutral-900">{{ computedOrder.size }}</span>
            </div>
            <div class="border-t border-neutral-100 pt-2.5" />
            <div class="flex justify-between text-sm">
              <span class="text-neutral-500">Цена изделия</span>
              <span class="font-medium text-neutral-900">{{ formatPrice(computedOrder.pricing.productPrice) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-neutral-500">Цена дизайна</span>
              <span class="font-medium text-neutral-900">{{ formatPrice(computedOrder.pricing.designPrice) }}</span>
            </div>
            <div v-if="computedOrder.pricing.deliveryPrice > 0" class="flex justify-between text-sm">
              <span class="text-neutral-500">Доставка</span>
              <span class="font-medium text-neutral-900">{{ formatPrice(computedOrder.pricing.deliveryPrice) }}</span>
            </div>
            <div class="flex justify-between border-t border-neutral-100 pt-2.5">
              <span class="text-sm font-bold text-neutral-900">Итоговая сумма</span>
              <span class="text-lg font-extrabold text-neutral-900">{{ formatPrice(computedOrder.pricing.total) }}</span>
            </div>
          </div>
        </div>

        <div class="mt-4 rounded-2xl bg-neutral-50 p-4">
          <p class="text-sm font-medium text-neutral-700">
            Оплата производится через Telegram Bot. После нажатия кнопки «Оплатить» вы будете перенаправлены в бот для завершения платежа.
          </p>
        </div>
      </div>

      <!-- STEP 7: Delivery -->
      <div v-else-if="wizard.step === 7" class="mt-5 space-y-4">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-neutral-700">Город</label>
          <input
            :value="wizard.order.delivery.city"
            type="text"
            placeholder="Ташкент"
            class="w-full rounded-xl border border-neutral-200 px-4 py-3.5 text-base text-neutral-900 outline-none transition-colors focus:border-neutral-900"
            @input="wizard.setDeliveryField('city', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-neutral-700">Адрес</label>
          <input
            :value="wizard.order.delivery.address"
            type="text"
            placeholder="Улица, дом, квартира"
            class="w-full rounded-xl border border-neutral-200 px-4 py-3.5 text-base text-neutral-900 outline-none transition-colors focus:border-neutral-900"
            @input="wizard.setDeliveryField('address', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-neutral-700">Телефон</label>
          <input
            :value="wizard.order.delivery.phone"
            type="tel"
            inputmode="tel"
            placeholder="+998 90 123 45 67"
            class="w-full rounded-xl border border-neutral-200 px-4 py-3.5 text-base text-neutral-900 outline-none transition-colors focus:border-neutral-900"
            @input="wizard.setDeliveryField('phone', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-neutral-700">Дополнительный комментарий</label>
          <textarea
            :value="wizard.order.delivery.comment"
            rows="3"
            placeholder="Необязательно"
            class="w-full rounded-xl border border-neutral-200 px-4 py-3.5 text-base text-neutral-900 outline-none transition-colors focus:border-neutral-900"
            @input="wizard.setDeliveryField('comment', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>

        <div class="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 class="text-sm font-bold text-neutral-900">Финальная сумма</h3>
          <div class="mt-3 flex justify-between">
            <span class="text-sm font-medium text-neutral-500">Итого к оплате</span>
            <span class="text-lg font-extrabold text-neutral-900">{{ formatPrice(computedOrder.pricing.total) }}</span>
          </div>
        </div>
      </div>

      <!-- Manufacturing time — visible on all steps -->
      <div class="mt-6 flex items-center gap-2 rounded-xl bg-neutral-50 px-4 py-3">
        <svg class="h-4 w-4 flex-shrink-0 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span class="text-sm font-medium text-neutral-600">Срок изготовления: {{ MANUFACTURING_DAYS }} дней</span>
      </div>
    </main>

    <!-- Bottom action bar -->
    <div class="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-neutral-100 bg-white px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <!-- Step 6: Payment button -->
      <button
        v-if="wizard.step === 6"
        class="w-full rounded-2xl bg-neutral-900 py-4 text-base font-bold text-white transition-opacity active:opacity-80"
        :class="{ 'opacity-50': wizard.order.payment.status === 'awaiting_payment' }"
        :disabled="wizard.order.payment.status === 'awaiting_payment'"
        @click="handlePayment"
      >
        {{ wizard.order.payment.status === 'awaiting_payment' ? 'Ожидание оплаты...' : 'Оплатить' }}
      </button>
      <!-- Step 7: Submit order -->
      <div v-else-if="wizard.step === 7" class="flex items-center justify-between gap-3">
        <button
          class="flex-shrink-0 rounded-2xl border border-neutral-200 px-5 py-4 text-sm font-semibold text-neutral-700 transition-colors active:bg-neutral-50"
          @click="goBack"
        >
          Назад
        </button>
        <button
          class="flex-1 rounded-2xl bg-neutral-900 py-4 text-base font-bold text-white transition-opacity active:opacity-80"
          :disabled="!wizard.isStepValid || wizard.isSubmitting"
          @click="handleOrderSubmit"
        >
          {{ wizard.isSubmitting ? 'Оформляем...' : 'Оформить заказ' }}
        </button>
      </div>
      <!-- Steps 1-5: Back + Next -->
      <div v-else class="flex items-center justify-between gap-3">
        <button
          class="flex-shrink-0 rounded-2xl border border-neutral-200 px-5 py-4 text-sm font-semibold text-neutral-700 transition-colors active:bg-neutral-50"
          @click="goBack"
        >
          Назад
        </button>
        <button
          class="flex-1 rounded-2xl bg-neutral-900 py-4 text-base font-bold text-white transition-opacity active:opacity-80"
          :disabled="!wizard.isStepValid"
          @click="goNext"
        >
          Далее
        </button>
      </div>
    </div>
  </div>
</template>
