<template>
  <div class="slide-up pb-8">
    <StepHeader
      :step="5"
      eyebrow="Доставка"
      title="Куда доставить?"
      description="Укажи адрес, и мы сообщим, когда заказ будет готов."
    />
    <div class="space-y-4">
      <label class="block text-sm font-bold"
        >Город<input
          v-model="city"
          class="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-4 text-sm outline-none focus:border-sage"
          placeholder="Например, Ташкент"
      /></label>
      <label class="block text-sm font-bold"
        >Полный адрес<textarea
          v-model="address"
          class="mt-2 min-h-24 w-full resize-none rounded-2xl border border-line bg-white px-4 py-4 text-sm outline-none focus:border-sage"
          placeholder="Улица, дом, квартира"
        />
      </label>
      <label class="block text-sm font-bold"
        >Комментарий <span class="font-normal text-ink/45">(необязательно)</span
        ><textarea
          v-model="comment"
          class="mt-2 min-h-20 w-full resize-none rounded-2xl border border-line bg-white px-4 py-4 text-sm outline-none focus:border-sage"
          placeholder="Например, позвонить перед доставкой"
        />
      </label>
    </div>
    <div v-if="catalog.loading" class="mt-7 rounded-2xl border border-line bg-white p-4 text-sm text-ink/60">
      Загружаем настройки заказа...
    </div>
    <div v-else-if="catalog.error" class="mt-7 rounded-2xl border border-terracotta/30 bg-terracotta/5 p-4 text-sm text-terracotta">
      {{ catalog.error }}
    </div>
    <div v-else-if="city.trim() && address.trim()" class="mt-7">
      <OrderRecap />
      <p class="mt-5 text-sm font-bold text-sage">Срок изготовления: {{ order.draft.manufacturingDays }} дней</p>
    </div>
    <p v-if="error" class="mt-3 text-sm text-terracotta">{{ error }}</p>
    <BackNext
      back-to="/measurements"
      :disabled="!city.trim() || !address.trim() || submitting"
      :loading="submitting"
      next-label="Оформить заказ"
      @next="submit"
    />
  </div>
</template>
<script setup lang="ts">
import type { CreatedOrder } from "~/types/order";

useSeoMeta({ robots: "noindex, nofollow" });
const order = useOrderStore();
const api = useApi();
const catalog = useCatalog();
// getInitData funksiyasini ham chaqirib olamiz
const { authenticate, error: authError, getInitData } = useTelegram();
const city = ref(order.draft.delivery.city);
const address = ref(order.draft.delivery.address);
const comment = ref(order.draft.delivery.comment);
const error = ref("");
const submitting = ref(false);

onMounted(() => catalog.loadCatalog());

watch([city, address, comment], () =>
  order.setDelivery({
    city: city.value,
    address: address.value,
    comment: comment.value,
  }),
);

async function submit(): Promise<void> {
  if (submitting.value || catalog.loading || catalog.error) return;
  if (!city.value.trim() || !address.value.trim()) {
    error.value = "Введите город и адрес доставки";
    return;
  }

  submitting.value = true;
  error.value = "";

  const currentUser = await authenticate();
  if (!currentUser) {
    error.value = authError.value || "Откройте приложение через Telegram";
    submitting.value = false;
    return;
  }

  const draft = order.draft;

  try {
    // Backend kutayotgan ID'larga moslashtirish (mapping)
    const serverProductId = draft.product?.id || "";
    const serverFabricId = draft.fabric?.id || "";
    const serverDesignId = draft.design?.existingDesignId || "";
    const serverSize = ["XS", "S", "M", "L", "XL", "XXL"].includes(
      draft.size as string,
    )
      ? draft.size
      : draft.size?.standardSize || "XXL";

    const result = await api.createOrder({
      telegramInitData: getInitData() || "",
      contact: {
        name: draft.customer.firstName || draft.customer.username || "Клиент",
        phone: draft.customer.phone || "",
      },

      productId: serverProductId,
      fabricId: serverFabricId,
      designId: serverDesignId,
      designType: draft.design?.type || "",
      designName: draft.design?.existingDesignName || null,

      // AI-generated design image
      aiFrontImage: draft.design?.aiFrontImage || null,

      // Client-uploaded design image
      uploadedImageUrl: draft.design?.uploadedImageUrl || null,

      size: serverSize as string,

      delivery: {
        city: city.value,
        address: address.value,
        phone: draft.customer.phone || "",
        comment: comment.value || "",
      },
    });

    const created: CreatedOrder = {
      // Backend qaytargan ID ni olamiz, topilmasa vaqtni beramiz
      id: String(
        (result as any).data?.id || (result as any).order?.id || Date.now(),
      ),
      createdAt: new Date().toISOString(),
      ...draft,
    };
    order.setCreatedOrder(created);
    await navigateTo("/success");
  } catch (requestError: unknown) {
    error.value =
      requestError instanceof Error
        ? requestError.message
        : "Не удалось оформить заказ. Попробуйте ещё раз.";
  } finally {
    submitting.value = false;
  }
}
</script>
