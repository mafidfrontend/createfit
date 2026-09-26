import assert from 'node:assert/strict'
import test from 'node:test'
import {
  hashOrderRequest,
  isValidIdempotencyKey,
} from '../server/services/idempotency.ts'

const baseRequest = {
  contact: { name: 'Test User', phone: '+10000000000' },
  productId: 'tee',
  fabricId: 'cotton',
  designId: 'ai',
  designType: 'ai',
  designName: 'Synthetic design',
  aiFrontImage: 'https://example.test/ai.png',
  uploadedImageUrl: null,
  size: 'M',
  delivery: {
    city: 'Test City',
    address: '1 Test Street',
    phone: '+10000000000',
    comment: 'Leave at door',
  },
}

test('accepts frontend-sized idempotency keys and rejects invalid lengths/characters', () => {
  assert.equal(isValidIdempotencyKey('1234567890abcdef'), true)
  assert.equal(isValidIdempotencyKey('a'.repeat(128)), true)
  assert.equal(isValidIdempotencyKey('short'), false)
  assert.equal(isValidIdempotencyKey('a'.repeat(129)), false)
  assert.equal(isValidIdempotencyKey('valid key with spaces'), false)
})

test('same logical request produces the same hash', () => {
  assert.equal(hashOrderRequest(baseRequest), hashOrderRequest({
    ...baseRequest,
    contact: { ...baseRequest.contact },
    delivery: { ...baseRequest.delivery },
  }))
})

test('normalization makes surrounding whitespace equivalent', () => {
  const padded = {
    ...baseRequest,
    productId: ' tee ',
    delivery: { ...baseRequest.delivery, city: ' Test City ' },
  }
  assert.equal(hashOrderRequest(baseRequest), hashOrderRequest(padded))
})

test('material request changes produce different hashes', () => {
  assert.notEqual(hashOrderRequest(baseRequest), hashOrderRequest({ ...baseRequest, productId: 'tracksuit' }))
  assert.notEqual(hashOrderRequest(baseRequest), hashOrderRequest({ ...baseRequest, delivery: { ...baseRequest.delivery, address: '2 Test Street' } }))
  assert.notEqual(hashOrderRequest(baseRequest), hashOrderRequest({ ...baseRequest, aiFrontImage: 'https://example.test/other.png' }))
})
