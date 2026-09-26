import type { Fabric, Product } from '~/types/order'
import type { CatalogSettings } from '~/types/catalog'

let catalogLoadPromise: Promise<void> | null = null

export function useCatalog() {
  const order = useOrderStore()
  const api = useApi()
  const products = useState<Product[]>('catalog-products', () => [])
  const fabrics = useState<Fabric[]>('catalog-fabrics', () => [])
  const settings = useState<CatalogSettings | null>('catalog-settings', () => null)
  const loaded = useState<boolean>('catalog-loaded', () => false)
  const loading = useState<boolean>('catalog-loading', () => false)
  const error = useState<string>('catalog-error', () => '')

  async function loadCatalog(): Promise<void> {
    if (loaded.value) return
    if (catalogLoadPromise) return catalogLoadPromise

    loading.value = true
    error.value = ''
    catalogLoadPromise = Promise.all([
      api.getCatalogProducts(),
      api.getCatalogFabrics(),
      api.getCatalogSettings(),
    ])
      .then(([productResponse, fabricResponse, settingsResponse]) => {
        products.value = productResponse.products.map((product) => ({
          id: product.slug,
          slug: product.slug,
          catalogId: product.id,
          name: product.name,
          basePrice: product.price,
          description: product.description ?? '',
        }))
        fabrics.value = fabricResponse.fabrics.map((fabric) => ({
          id: fabric.slug,
          slug: fabric.slug,
          catalogId: fabric.id,
          name: fabric.name,
          additionalPrice: fabric.additional_price,
          description: fabric.description ?? '',
        }))
        settings.value = settingsResponse.settings

        if (order.draft.product && !products.value.some((product) => product.id === order.draft.product?.id)) {
          order.clearProduct()
          error.value = 'Сохранённое изделие больше недоступно. Выберите новое изделие.'
        }
        if (order.draft.fabric && !fabrics.value.some((fabric) => fabric.id === order.draft.fabric?.id)) {
          order.clearFabric()
          error.value = error.value || 'Сохраненная ткань больше недоступна. Выберите новую ткань.'
        }

        order.setStoreSettings(settingsResponse.settings)
        loaded.value = true
      })
      .catch((loadError: unknown) => {
        error.value = loadError instanceof Error
          ? loadError.message
          : 'Не удалось загрузить каталог. Попробуйте позже.'
      })
      .finally(() => {
        loading.value = false
        catalogLoadPromise = null
      })

    return catalogLoadPromise
  }

  return {
    products,
    fabrics,
    settings,
    currency: computed(() => settings.value?.currency ?? ''),
    loaded,
    loading,
    error,
    loadCatalog,
  }
}
