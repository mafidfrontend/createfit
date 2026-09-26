<template>
  <div class="space-y-3 rounded-xl border border-line bg-white p-4 text-sm">
    <div v-if="order.product" class="flex justify-between gap-4">
      <span class="text-ink/55">Изделие</span>
      <b class="text-right">{{ order.product.name }} {{ formatCurrency(order.product.basePrice, catalog.currency) }}</b>
    </div>

    <div v-if="order.fabric" class="flex justify-between gap-4">
      <span class="text-ink/55">Ткань</span>
      <b class="text-right">{{ order.fabric.name }} +{{ formatCurrency(order.fabric.additionalPrice, catalog.currency) }}</b>
    </div>

    <div v-if="order.design" class="flex justify-between gap-4">
      <span class="text-ink/55">Дизайн</span>
      <b class="text-right">
        {{ order.design.type === "uploaded" ? "Свой дизайн" : order.design.type === "ai" ? "AI-дизайн" : order.design.existingDesignName }}
        {{ formatCurrency(order.design.additionalPrice, catalog.currency) }}
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
      <b class="text-right">{{ formatCurrency(order.subtotal, catalog.currency) }}</b>
    </div>

    <div class="flex justify-between gap-4">
      <span class="text-ink/55">Доставка</span>
      <b class="text-right">+{{ formatCurrency(order.deliveryPrice, catalog.currency) }}</b>
    </div>

    <div class="flex justify-between border-t border-line pt-3 text-lg">
      <span>Итого</span>
      <b class="text-sage">
        {{ formatCurrency(order.totalPrice, catalog.currency) }}
      </b>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from "~/utils/pricing";

const store = useOrderStore();
const order = computed(() => store.draft);
const catalog = useCatalog();
</script>
