import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import { requireTelegramUser, validateInitData } from '../server/utils/telegram.ts'

const BOT_TOKEN = 'test-bot-token'

function createInitData(userId: number, authDate = Math.floor(Date.now() / 1000), token = BOT_TOKEN): string {
  const params = new URLSearchParams({
    auth_date: String(authDate),
    user: JSON.stringify({ id: userId, first_name: `User ${userId}`, username: `user${userId}` }),
  })
  const dataCheckString = Array.from(params.keys())
    .sort()
    .map((key) => `${key}=${params.get(key)}`)
    .join('\n')
  const secretKey = createHmac('sha256', 'WebAppData').update(token).digest()
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
  params.set('hash', hash)
  return params.toString()
}

function mockRuntime(eventHeaders: Record<string, string>, botToken = BOT_TOKEN): void {
  globalThis.getHeader = (event: { headers: Record<string, string> }, name: string) => event.headers[name.toLowerCase()]
  globalThis.useRuntimeConfig = () => ({ telegramBotToken: botToken })
  globalThis.createError = ({ statusCode, statusMessage }: { statusCode: number; statusMessage: string }) =>
    Object.assign(new Error(statusMessage), { statusCode, statusMessage })
}

test('accepts valid initData and returns the verified user', () => {
  const initData = createInitData(101)
  const user = validateInitData(initData, BOT_TOKEN)

  assert.deepEqual(user, { id: 101, first_name: 'User 101', username: 'user101' })
})

test('rejects tampered initData', () => {
  const initData = createInitData(101).replace('User+101', 'User+999')

  assert.equal(validateInitData(initData, BOT_TOKEN), null)
})

test('rejects tampered initData with 401 at the request boundary', () => {
  const initData = createInitData(101).replace('User+101', 'User+999')
  mockRuntime({ authorization: `tma ${initData}` })

  assert.throws(
    () => requireTelegramUser({ headers: { authorization: `tma ${initData}` } } as never),
    (error: { statusCode?: number }) => error.statusCode === 401,
  )
})

test('rejects expired initData', () => {
  const expired = createInitData(101, Math.floor(Date.now() / 1000) - 86401)

  assert.equal(validateInitData(expired, BOT_TOKEN), null)
})

test('rejects expired initData with 401 at the request boundary', () => {
  const expired = createInitData(101, Math.floor(Date.now() / 1000) - 86401)
  mockRuntime({ authorization: `tma ${expired}` })

  assert.throws(
    () => requireTelegramUser({ headers: { authorization: `tma ${expired}` } } as never),
    (error: { statusCode?: number }) => error.statusCode === 401,
  )
})

test('rejects missing initData with 401', () => {
  mockRuntime({})

  assert.throws(
    () => requireTelegramUser({ headers: {} } as never),
    (error: { statusCode?: number }) => error.statusCode === 401,
  )
})

test('prefers verified Authorization identity over forged body identity', () => {
  const initData = createInitData(101)
  mockRuntime({ authorization: `tma ${initData}` })

  const user = requireTelegramUser(
    { headers: { authorization: `tma ${initData}` } } as never,
    createInitData(202),
  )

  assert.equal(user.id, 101)
  assert.equal(user.username, 'user101')
})

test('supports the existing body initData transport when no auth header exists', () => {
  const initData = createInitData(303)
  mockRuntime({})

  const user = requireTelegramUser({ headers: {} } as never, initData)

  assert.equal(user.id, 303)
})
