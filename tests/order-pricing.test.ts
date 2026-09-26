import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateOrderPricing, resolveOrderDesign } from '../server/services/order-pricing.ts'

// --- Design resolution -----------------------------------------------------

test('predefined design resolves from an active catalog row, ignoring client name/price', () => {
  const design = resolveOrderDesign(
    { designType: 'existing', designId: 'street-floral', designName: 'Client-supplied name' },
    { id: 'uuid-design-1', slug: 'street-floral', name: 'Флористика', price: 15 },
  )

  assert.deepEqual(design, {
    catalogId: 'uuid-design-1',
    slug: 'street-floral',
    name: 'Флористика',
    price: 15,
  })
})

test('predefined design is rejected when no active catalog row is found', () => {
  const design = resolveOrderDesign(
    { designType: 'existing', designId: 'unknown-slug', designName: null },
    null,
  )

  assert.equal(design, undefined)
})

test('AI design remains order-specific with zero surcharge and no catalog id', () => {
  const design = resolveOrderDesign(
    { designType: 'ai', designId: '', designName: 'My AI design' },
    null,
  )

  assert.deepEqual(design, {
    catalogId: null,
    slug: 'ai',
    name: 'My AI design',
    price: 0,
  })
})

test('uploaded design remains order-specific with zero surcharge and no catalog id', () => {
  const design = resolveOrderDesign(
    { designType: 'uploaded', designId: 'upload-123', designName: null },
    null,
  )

  assert.deepEqual(design, {
    catalogId: null,
    slug: 'upload-123',
    name: 'Загруженный дизайн',
    price: 0,
  })
})

test('unknown/missing design type is rejected', () => {
  const design = resolveOrderDesign({ designType: '', designId: '', designName: null }, null)
  assert.equal(design, undefined)
})

// --- Pricing calculation ----------------------------------------------------

test('total price is the sum of catalog product, fabric, design, and settings delivery price', () => {
  const pricing = calculateOrderPricing(
    { price: 25 },
    { additionalPrice: 30 },
    { price: 15 },
    { delivery_price: 10 },
  )

  assert.equal(pricing.productPrice, 25)
  assert.equal(pricing.fabricPrice, 30)
  assert.equal(pricing.designPrice, 15)
  assert.equal(pricing.deliveryPrice, 10)
  assert.equal(pricing.totalPrice, 80)
})

test('pricing calculation has no client-price parameter, so a client value cannot reach the total', () => {
  // calculateOrderPricing only accepts catalog/settings shapes (price and
  // additionalPrice fields resolved server-side); there is no code path for
  // a request-body price/subtotal/total to be substituted here.
  const pricing = calculateOrderPricing(
    { price: 25 },
    { additionalPrice: 0 },
    { price: 0 },
    { delivery_price: 10 },
  )

  assert.equal(pricing.totalPrice, 35)
})
