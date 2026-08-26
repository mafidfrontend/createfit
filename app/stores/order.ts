import { defineStore } from "pinia";
import type {
  OrderState,
  Contact,
  Product,
  Fabric,
  Design,
  Size,
  Delivery,
} from "~/app/types/order";

const DELIVERY_PRICE = 7;

export const useOrderStore = defineStore("order", {
  state: (): OrderState => ({
    contact: null,
    product: null,
    fabric: null,
    design: null,
    size: null,
    delivery: null,
    pricing: {
      productPrice: 0,
      fabricPrice: 0,
      designPrice: 0,
      deliveryPrice: DELIVERY_PRICE,
      total: DELIVERY_PRICE,
    },
    payment: {
      status: "pending",
    },
  }),

  getters: {
    isContactComplete: (state) => {
      return !!(state.contact?.name && state.contact?.phone);
    },

    isProductSelected: (state) => {
      return !!state.product;
    },

    isFabricSelected: (state) => {
      return !!state.fabric;
    },

    isDesignSelected: (state) => {
      return !!state.design;
    },

    isSizeSelected: (state) => {
      return !!state.size;
    },

    isDeliveryComplete: (state) => {
      return !!(
        state.delivery?.city &&
        state.delivery?.address &&
        state.delivery?.phone
      );
    },

    totalPrice: (state) => {
      return state.pricing.total;
    },

    canProceedToPayment: (state) => {
      return !!(
        state.contact &&
        state.product &&
        state.fabric &&
        state.design &&
        state.size
      );
    },
  },

  actions: {
    setContact(contact: Contact) {
      this.contact = contact;
    },

    setProduct(product: Product) {
      this.product = product;
      this.updatePricing();
    },

    setFabric(fabric: Fabric) {
      this.fabric = fabric;
      this.updatePricing();
    },

    setDesign(design: Design) {
      this.design = design;
      this.updatePricing();
    },

    setSize(size: Size) {
      this.size = size;
    },

    setDelivery(delivery: Delivery) {
      this.delivery = delivery;
    },

    updatePricing() {
      this.pricing.productPrice = this.product?.price || 0;
      this.pricing.fabricPrice = this.fabric?.price || 0;
      this.pricing.designPrice = this.design?.price || 0;
      this.pricing.deliveryPrice = DELIVERY_PRICE;

      this.pricing.total =
        this.pricing.productPrice +
        this.pricing.fabricPrice +
        this.pricing.designPrice +
        this.pricing.deliveryPrice;
    },

    setPaymentStatus(status: "pending" | "paid" | "failed") {
      this.payment.status = status;
    },

    resetOrder() {
      this.contact = null;
      this.product = null;
      this.fabric = null;
      this.design = null;
      this.size = null;
      this.delivery = null;
      this.pricing = {
        productPrice: 0,
        fabricPrice: 0,
        designPrice: 0,
        deliveryPrice: DELIVERY_PRICE,
        total: DELIVERY_PRICE,
      };
      this.payment = {
        status: "pending",
      };
    },

    async submitOrder(initData: string) {
      try {
        const payload = {
          telegramInitData: initData,
          contact: {
            name: this.contact?.name || "Клиент",
            phone: this.contact?.phone || this.delivery?.phone || "",
          },
          // ID larni to'g'ridan-to'g'ri olamiz
          productId: this.product?.id,
          fabricId: this.fabric?.id,
          designId: this.design?.id,
          size:
            typeof this.size === "string"
              ? this.size
              : this.size?.standardSize || "M",
          delivery: {
            city: this.delivery?.city || "",
            address: this.delivery?.address || "",
            phone: this.delivery?.phone || this.contact?.phone || "",
            comment: this.delivery?.comment || "",
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
            err.data?.message ||
            err.data?.statusMessage ||
            err.message ||
            "Xatolik yuz berdi",
        };
      }
    },
  },
});
