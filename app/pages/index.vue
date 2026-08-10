<script setup lang="ts">
import AppHeader from '~/components/AppHeader.vue'
import BottomNav from '~/components/BottomNav.vue'
import BrandFooter from '~/components/BrandFooter.vue'
import { useTelegram } from '~/composables/useTelegram'

const { haptic } = useTelegram()
const router = useRouter()

function startOrder() {
  haptic('medium')
  router.push('/order')
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <AppHeader show-menu />

    <main class="flex-1 pb-20">
      <section class="px-5 pt-8 pb-6">
        <h1 class="text-3xl font-extrabold leading-tight text-neutral-900">
          Создай свою<br />одежду на заказ
        </h1>
        <p class="mt-3 text-sm leading-relaxed text-neutral-500">
          Выбери изделие, ткань и дизайн — мы сошьём за 7 дней
        </p>
        <button
          class="mt-6 w-full rounded-2xl bg-neutral-900 py-4 text-base font-bold text-white transition-opacity active:opacity-80"
          @click="startOrder"
        >
          Начать заказ
        </button>
      </section>

      <section class="px-5 py-6">
        <h2 class="mb-4 text-lg font-bold text-neutral-900">Как это работает</h2>
        <div class="space-y-4">
          <div class="flex items-start gap-4">
            <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">1</div>
            <div>
              <p class="text-sm font-semibold text-neutral-900">Выбери изделие и ткань</p>
              <p class="mt-0.5 text-xs text-neutral-500">Футболки, костюмы и комплекты</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">2</div>
            <div>
              <p class="text-sm font-semibold text-neutral-900">Выбери дизайн</p>
              <p class="mt-0.5 text-xs text-neutral-500">Готовые дизайны из каталога</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">3</div>
            <div>
              <p class="text-sm font-semibold text-neutral-900">Оплати и получи заказ</p>
              <p class="mt-0.5 text-xs text-neutral-500">Оплата через Telegram, доставка по адресу</p>
            </div>
          </div>
        </div>
      </section>

      <div class="px-5 pb-6">
        <div class="rounded-2xl bg-neutral-50 px-5 py-4">
          <p class="text-sm font-semibold text-neutral-900">Срок изготовления: 7 дней</p>
          <p class="mt-1 text-xs text-neutral-500">От выбора до готового изделия</p>
        </div>
      </div>

      <BrandFooter />
    </main>

    <BottomNav />
  </div>
</template>
