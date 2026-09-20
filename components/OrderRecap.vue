<template>
  <div class="space-y-3 rounded-xl border border-line bg-white p-4 text-sm">
    <div v-if="order.product" class="flex justify-between gap-4">
      <span class="text-ink/55">Изделие</span>
      <b class="text-right">{{ order.product.name }} {{ formatUsd(order.product.basePrice) }}</b>
    </div>

    <div v-if="order.fabric" class="flex justify-between gap-4">
      <span class="text-ink/55">Ткань</span>
      <b class="text-right">{{ order.fabric.name }} +{{ formatUsd(order.fabric.additionalPrice) }}</b>
    </div>

    <div v-if="order.design" class="flex justify-between gap-4">
      <span class="text-ink/55">Дизайн</span>
      <b class="text-right">
        {{ order.design.type === "uploaded" ? "Свой дизайн" : order.design.type === "ai" ? "AI-дизайн" : order.design.existingDesignName }}
        {{ formatUsd(order.design.additionalPrice) }}
      </b>
    </div>

    <div v-if="order.size" class="flex justify-between gap-4">
      <span class="text-ink/55">Размер</span>
      <b class="text-right">
        {{
          order.size.type === "custom"
            ? "Индивидуальный"
            : order.size.standardSize
        }}
      </b>
    </div>

    <div class="flex justify-between gap-4 border-t border-line pt-3">
      <span class="text-ink/55">Стоимость изделия</span>
      <b class="text-right">{{ formatUsd(order.subtotal) }}</b>
    </div>

    <div class="flex justify-between gap-4">
      <span class="text-ink/55">Доставка</span>
      <b class="text-right">+{{ formatUsd(order.deliveryPrice) }}</b>
    </div>

    <div class="flex justify-between border-t border-line pt-3 text-lg">
      <span>Итого</span>
      <b class="text-sage">
        {{ formatUsd(order.totalPrice) }}
      </b>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatUsd } from "~/utils/pricing";

const store = useOrderStore();
const order = computed(() => store.draft);
</script>
