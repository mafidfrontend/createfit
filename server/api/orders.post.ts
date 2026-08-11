import { nanoid } from 'nanoid'
import { notifyAdmin, saveOrder, validateDraft } from '../utils/order'

export default defineEventHandler(async (event) => {
  try {
    const order = validateDraft(await readBody(event))
    const createdAt = new Date().toISOString()
    const id = `CF-${createdAt.slice(0, 10).replaceAll('-', '')}-${nanoid(4).toUpperCase()}`
    await saveOrder(order, id, createdAt)
    await notifyAdmin(order, id, createdAt)
    return { ...order, id, createdAt }
  } catch (error: unknown) {
    if (isError(error)) throw error
    console.error('Order creation failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Не удалось оформить заказ. Попробуйте ещё раз.' })
  }
})
