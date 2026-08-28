<template>
  <div class="slide-up pb-8">
    <div class="mb-7">
      <p class="text-xs font-bold uppercase tracking-[.16em] text-sage">
        История
      </p>
      <h1
        class="mt-2 text-[30px] font-extrabold leading-[1.08] tracking-[-.04em]"
      >
        Мои заказы
      </h1>
      <p class="mt-3 text-[15px] leading-6 text-ink/55">
        Все твои заказы в одном месте.
      </p>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <svg
        class="h-7 w-7 animate-spin text-sage"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>

    <div
      v-else-if="loadError"
      class="rounded-2xl border border-line bg-white p-5 text-center"
    >
      <p class="text-sm text-terracotta">{{ loadError }}</p>
      <button
        class="mt-4 text-sm font-bold text-sage underline"
        @click="loadOrders"
      >
        Повторить
      </button>
    </div>

    <div
      v-else-if="orders.length === 0"
      class="rounded-[22px] border border-line bg-[#FAFBFD] px-6 py-12 text-center"
    >
      <div
        class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint text-2xl text-sage"
      >
        ☰
      </div>
      <h2 class="mt-6 text-xl font-extrabold tracking-[-.03em]">
        У вас пока нет заказов
      </h2>
      <p class="mt-3 text-sm leading-6 text-ink/55">
        Создайте своё первое изделие — это займёт пару минут.
      </p>
      <NuxtLink
        to="/create"
        class="mt-7 inline-block rounded-xl bg-sage px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#0a4ad4]"
        >Создать изделие</NuxtLink
      >
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="order in orders"
        :key="order.id"
        class="rounded-2xl border border-line bg-white p-5"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-sage"
            >Заказ {{ order.order_number }}</span
          >
          <span
            class="rounded-full bg-mint px-3 py-1 text-xs font-bold text-sage"
          >
            {{
              order.payment_status === "awaiting_payment"
                ? "Ожидает оплаты"
                : "В обработке"
            }}
          </span>
        </div>

        <div class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between gap-4">
            <span class="text-ink/55">Изделие</span>
            <b class="text-right"
              >{{ order.product?.name }} ({{ order.size }})</b
            >
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-ink/55">Ткань</span>
            <b class="text-right">{{ order.fabric?.name }}</b>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-ink/55">Дизайн</span>
            <b class="text-right">{{
              order.design?.existingDesignName || "Свой дизайн"
            }}</b>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-ink/55">Доставка</span>
            <b class="text-right">{{ order.city }}</b>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-ink/55">Сумма</span>
            <b class="text-right text-sage">${{ order.total_price }}</b>
          </div>
          <div class="flex justify-between gap-4 border-t border-line pt-2">
            <span class="text-ink/55">Дата</span>
            <b class="text-right">{{ formatDate(order.created_at) }}</b>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiOrder } from "~/types/api";
import { statusLabel } from "~/types/api";

useSeoMeta({ robots: "noindex, nofollow" });

const api = useApi();
const { authenticate, error: authError } = useTelegram();
const orders = ref<ApiOrder[]>([]);
const loading = ref(true);
const loadError = ref("");

async function loadOrders(): Promise<void> {
  loading.value = true;
  loadError.value = "";

  const currentUser = await authenticate();
  if (!currentUser) {
    loading.value = false;
    loadError.value = authError.value || "Откройте приложение через Telegram";
    return;
  }

  if (import.meta.dev) console.log("[orders] requesting /api/orders/me");
  try {
    orders.value = await api.getMyOrders();
    if (import.meta.dev)
      console.log("[orders] loaded", orders.value.length, "orders");
  } catch (err: unknown) {
    loadError.value =
      err instanceof Error ? err.message : "Не удалось загрузить заказы";
    if (import.meta.dev)
      console.log("[orders] request failed:", loadError.value);
  } finally {
    loading.value = false;
  }
}

onMounted(loadOrders);

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
</script>
