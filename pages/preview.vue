<template>
	<div class="slide-up pb-8">
		<StepHeader :step="2" eyebrow="Изделие" title="Выбери основу" description="Все изделия создаются по твоему выбору." />
		<p v-if="catalog.loading" class="rounded-2xl border border-line bg-white p-4 text-sm text-ink/60">Загружаем каталог изделий...</p>
		<p v-else-if="catalog.error" class="rounded-2xl border border-terracotta/30 bg-terracotta/5 p-4 text-sm text-terracotta">{{ catalog.error }}</p>
		<div v-else class="space-y-3">
			<OptionCard v-for="product in catalog.products" :key="product.id" :title="product.name" :description="product.description" :price="product.basePrice" :currency="catalog.currency" :selected="order.draft.product?.id === product.id" @select="order.setProduct(product)" />
		</div>
		<p v-if="error" class="mt-3 text-sm text-terracotta">{{ error }}</p>
		<BackNext back-to="/create" :disabled="catalog.loading || !!catalog.error || !order.draft.product" @next="goNext" />
	</div>
</template>

<script setup lang="ts">
useSeoMeta({ robots: 'noindex, nofollow' })
const order = useOrderStore()
const catalog = useCatalog()
const error = ref('')

onMounted(() => catalog.loadCatalog())

function goNext(): void {
	if (!order.draft.product) {
		error.value = 'Выберите изделие'
		return
	}
	navigateTo('/design')
}
</script>
