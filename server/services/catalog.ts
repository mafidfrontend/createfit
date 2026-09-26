import { createClient } from '@supabase/supabase-js'

type ProductRow = {
  id: string
  slug: string
  name: string
  description: string | null
  price: number | string
  sort_order: number
}

type FabricRow = {
  id: string
  slug: string
  name: string
  description: string | null
  additional_price: number | string
  sort_order: number
}

type SettingsRow = {
  delivery_price: number | string
  manufacturing_days: number
  currency: string
}

export interface OrderCatalogProduct {
  id: string
  slug: string
  name: string
  price: number
}

export interface OrderCatalogFabric {
  id: string
  slug: string
  name: string
  additionalPrice: number
}

export interface OrderCatalogDesign {
  id: string
  slug: string
  name: string
  price: number
}

function getCatalogClient() {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Хранилище каталога недоступно' })
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
}

function toNumber(value: number | string, field: string): number {
  const number = Number(value)
  if (!Number.isFinite(number)) {
    throw createError({ statusCode: 500, statusMessage: `Некорректное значение каталога: ${field}` })
  }
  return number
}

export async function getActiveProducts() {
  const { data, error } = await getCatalogClient()
    .from('products')
    .select('id,slug,name,description,price,sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Не удалось загрузить каталог изделий' })
  }

  return (data as ProductRow[] | null ?? []).map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: toNumber(product.price, 'products.price'),
    sort_order: product.sort_order,
  }))
}

export async function getActiveFabrics() {
  const { data, error } = await getCatalogClient()
    .from('fabrics')
    .select('id,slug,name,description,additional_price,sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Не удалось загрузить каталог тканей' })
  }

  return (data as FabricRow[] | null ?? []).map((fabric) => ({
    id: fabric.id,
    slug: fabric.slug,
    name: fabric.name,
    description: fabric.description,
    additional_price: toNumber(fabric.additional_price, 'fabrics.additional_price'),
    sort_order: fabric.sort_order,
  }))
}

export async function getStoreSettings() {
  const { data, error } = await getCatalogClient()
    .from('store_settings')
    .select('delivery_price,manufacturing_days,currency')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Не удалось загрузить настройки магазина' })
  }

  if (!data) {
    throw createError({ statusCode: 500, statusMessage: 'Настройки магазина не найдены' })
  }

  const settings = data as SettingsRow
  return {
    delivery_price: toNumber(settings.delivery_price, 'store_settings.delivery_price'),
    manufacturing_days: settings.manufacturing_days,
    currency: settings.currency,
  }
}

// Order-creation lookups: null means "not found or inactive" (a 400-level
// business rejection). A thrown error means the catalog DB itself failed
// (a 500-level infrastructure error). Callers must keep these cases distinct.

export async function getActiveProductBySlug(slug: string): Promise<OrderCatalogProduct | null> {
  const { data, error } = await getCatalogClient()
    .from('products')
    .select('id,slug,name,price')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Не удалось проверить каталог изделий' })
  }
  if (!data) return null

  const row = data as { id: string; slug: string; name: string; price: number | string }
  return { id: row.id, slug: row.slug, name: row.name, price: toNumber(row.price, 'products.price') }
}

export async function getActiveFabricBySlug(slug: string): Promise<OrderCatalogFabric | null> {
  const { data, error } = await getCatalogClient()
    .from('fabrics')
    .select('id,slug,name,additional_price')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Не удалось проверить каталог тканей' })
  }
  if (!data) return null

  const row = data as { id: string; slug: string; name: string; additional_price: number | string }
  return { id: row.id, slug: row.slug, name: row.name, additionalPrice: toNumber(row.additional_price, 'fabrics.additional_price') }
}

export async function getActiveDesignBySlug(slug: string): Promise<OrderCatalogDesign | null> {
  const { data, error } = await getCatalogClient()
    .from('designs')
    .select('id,slug,name,price')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Не удалось проверить каталог дизайнов' })
  }
  if (!data) return null

  const row = data as { id: string; slug: string; name: string; price: number | string }
  return { id: row.id, slug: row.slug, name: row.name, price: toNumber(row.price, 'designs.price') }
}
