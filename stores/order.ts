import { defineStore } from "pinia";
import { DELIVERY_PRICE, MANUFACTURING_DAYS } from "~/config/catalog";
import { calculateSubtotal, calculateTotal } from "~/utils/pricing";
import type {
  CreatedOrder,
  Customer,
  Delivery,
  Design,
  Fabric,
  OrderDraft,
  PaymentMethod,
  Product,
  SizeSelection,
} from "~/types/order";

const emptyCustomer: Customer = {
  telegramId: null,
  firstName: "",
  lastName: "",
  username: null,
  phone: "",
  countryCode: "+998",
};
const emptyDelivery: Delivery = {
  city: "",
  address: "",
  comment: "",
  price: DELIVERY_PRICE,
};

const STORAGE_KEY = "fabrika_order";
const STALE_MS = 7 * 24 * 60 * 60 * 1000;

interface PersistedDraft {
  product: Product | null;
  fabric: Fabric | null;
  design: Design | null;
  size: SizeSelection | null;
  delivery: Delivery;
  paymentMethod: PaymentMethod | null;
  savedAt: number;
}

function loadPersistedDraft(): Partial<PersistedDraft> | null {
  if (!import.meta.client) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedDraft;
    if (typeof parsed !== "object" || parsed === null) return null;
    if (parsed.savedAt && Date.now() - parsed.savedAt > STALE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* localStorage unavailable */
    }
    return null;
  }
}

function savePersistedDraft(draft: OrderDraft): void {
  if (!import.meta.client) return;
  const data: PersistedDraft = {
    product: draft.product,
    fabric: draft.fabric,
    design: draft.design,
    size: draft.size,
    delivery: draft.delivery,
    paymentMethod: draft.paymentMethod,
    savedAt: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* localStorage unavailable or quota exceeded */
  }
}

function clearPersistedDraft(): void {
  if (!import.meta.client) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* localStorage unavailable */
  }
}

export const useOrderStore = defineStore("createfit-order", {
  state: (): {
    draft: OrderDraft;
    createdOrder: CreatedOrder | null;
    error: string;
  } => {
    const base: OrderDraft = {
      customer: { ...emptyCustomer },
      product: null,
      fabric: null,
      design: null,
      size: null,
      paymentMethod: null,
      paymentStatus: "pending",
      delivery: { ...emptyDelivery },
      subtotal: 0,
      deliveryPrice: DELIVERY_PRICE,
      totalPrice: DELIVERY_PRICE,
      manufacturingDays: MANUFACTURING_DAYS,
    };
    const persisted = loadPersistedDraft();
    if (persisted) {
      if (persisted.product) base.product = persisted.product;
      if (persisted.fabric) base.fabric = persisted.fabric;
      if (persisted.design) base.design = persisted.design;
      if (persisted.size) base.size = persisted.size;
      if (persisted.delivery)
        base.delivery = { ...base.delivery, ...persisted.delivery };
      if (persisted.paymentMethod) base.paymentMethod = persisted.paymentMethod;
      base.subtotal = calculateSubtotal(
        base.product,
        base.fabric,
        base.design?.additionalPrice ?? 0,
      );
      base.totalPrice = calculateTotal(
        base.product,
        base.fabric,
        base.design?.additionalPrice ?? 0,
        base.delivery.price,
      );
    }
    return { draft: base, createdOrder: null, error: "" };
  },
  getters: {
    hasContact: (state) => Boolean(state.draft.customer.phone),
    hasSize: (state) =>
      Boolean(
        state.draft.size?.type === "standard"
          ? state.draft.size.standardSize
          : state.draft.size?.customMeasurements?.height &&
              state.draft.size.customMeasurements.chest,
      ),
    displayName: (state) =>
      state.draft.customer.firstName ||
      (state.draft.customer.username
        ? `@${state.draft.customer.username}`
        : "Ваш профиль"),
  },
  actions: {
    setCustomer(customer: Partial<Customer>): void {
      this.draft.customer = { ...this.draft.customer, ...customer };
    },
    setProduct(product: Product): void {
      this.draft.product = product;
      this.recalculate();
      this.persist();
    },
    setFabric(fabric: Fabric): void {
      this.draft.fabric = fabric;
      this.recalculate();
      this.persist();
    },
    setDesign(design: Design): void {
      this.draft.design = design;
      this.recalculate();
      this.persist();
    },
    setSize(size: SizeSelection): void {
      this.draft.size = size;
      this.persist();
    },
    setPaymentMethod(method: PaymentMethod): void {
      this.draft.paymentMethod = method;
      this.persist();
    },
    setDelivery(delivery: Partial<Delivery>): void {
      this.draft.delivery = { ...this.draft.delivery, ...delivery };
      this.recalculate();
      this.persist();
    },
    recalculate(): void {
      this.draft.subtotal = calculateSubtotal(
        this.draft.product,
        this.draft.fabric,
        this.draft.design?.additionalPrice ?? 0,
      );
      this.draft.deliveryPrice = this.draft.delivery.price;
      this.draft.totalPrice = calculateTotal(
        this.draft.product,
        this.draft.fabric,
        this.draft.design?.additionalPrice ?? 0,
        this.draft.delivery.price,
      );
    },
    persist(): void {
      savePersistedDraft(this.draft);
    },
    setCreatedOrder(order: CreatedOrder): void {
      this.createdOrder = order;
      clearPersistedDraft();
    },
    reset(): void {
      this.$reset();
      clearPersistedDraft();
    },
    async submitOrder(initData: string) {
      try {
        const payload = {
          telegramInitData: initData,
          contact: {
            name: this.draft.customer.firstName,
            phone: this.draft.customer.phone,
          },
          productId: this.draft.product?.id,
          fabricId: this.draft.fabric?.id,
          designId: this.draft.design?.id,
          size:
            this.draft.size?.type === "standard"
              ? this.draft.size.standardSize
              : "Custom",
          delivery: {
            city: this.draft.delivery.city,
            address: this.draft.delivery.address,
            phone: this.draft.customer.phone,
            comment: this.draft.delivery.comment || "",
          },
        };

        const response = await $fetch("/api/order/create", {
          method: "POST",
          body: payload,
        });

        return { success: true, data: response };
      } catch (err: any) {
        console.error("Order submission error:", err);
        return {
          success: false,
          error:
            err.data?.message || err.data?.statusMessage || "Xatolik yuz berdi",
        };
      }
    },
  },
});
