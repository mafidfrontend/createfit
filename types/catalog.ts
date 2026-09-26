export interface CatalogProduct {
  id: string
  slug: string
  name: string
  description: string | null
  price: number
  sort_order: number
}

export interface CatalogFabric {
  id: string
  slug: string
  name: string
  description: string | null
  additional_price: number
  sort_order: number
}

export interface CatalogSettings {
  delivery_price: number
  manufacturing_days: number
  currency: string
}

export interface CatalogProductsResponse {
  products: CatalogProduct[]
}

export interface CatalogFabricsResponse {
  fabrics: CatalogFabric[]
}

export interface CatalogSettingsResponse {
  settings: CatalogSettings
}
