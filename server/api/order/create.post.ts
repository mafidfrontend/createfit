import { createOrder, type CreateOrderInput } from '../../services/orders'

interface OrderRequestBody {
  telegramInitData: string
  contact: { name: string; phone: string }
  productId: string
  fabricId: string
  designId: string
  size: string
  delivery: { city: string; address: string; phone: string; comment: string }
}

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    setResponseStatus(event, 405)
    return { success: false, error: 'Method not allowed' }
  }

  const body = await readBody<OrderRequestBody>(event)

  if (!body) {
    setResponseStatus(event, 400)
    return { success: false, error: 'Request body is required' }
  }

  if (!body.telegramInitData) {
    setResponseStatus(event, 400)
    return { success: false, error: 'Telegram initData is required' }
  }

  const input: CreateOrderInput = {
    telegramInitData: body.telegramInitData,
    contact: body.contact,
    productId: body.productId,
    fabricId: body.fabricId,
    designId: body.designId,
    size: body.size,
    delivery: body.delivery,
  }

  const result = await createOrder(input)

  if (!result.success) {
    setResponseStatus(event, 400)
    return { success: false, error: result.error }
  }

  setResponseStatus(event, 201)
  return {
    success: true,
    orderId: result.orderId,
    orderNumber: result.orderNumber,
    totalPrice: result.totalPrice,
    paymentStatus: result.paymentStatus,
    orderStatus: result.orderStatus,
    createdAt: result.createdAt,
  }
})
