import { createOrder, type CreateOrderInput } from '../../services/orders'
import { isValidIdempotencyKey } from '../../services/idempotency'
import { sendOrderToTelegramGroup } from '~/server/utils/telegram'
import { requireTelegramUser } from '~/server/utils/telegram'

interface OrderRequestBody {
  telegramInitData: string
  contact: { name: string; phone: string }
  productId: string
  fabricId: string
  designId: string
  designType?: string
  designName?: string | null
  aiFrontImage?: string | null
  uploadedImageUrl?: string | null
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

  const idempotencyKey = getHeader(event, 'idempotency-key')?.trim()
  if (!idempotencyKey || !isValidIdempotencyKey(idempotencyKey)) {
    setResponseStatus(event, 400)
    return { success: false, error: 'A valid Idempotency-Key header is required' }
  }

  const telegramUser = requireTelegramUser(event, body.telegramInitData)

  const input: CreateOrderInput = {
    contact: body.contact,
    productId: body.productId,
    fabricId: body.fabricId,
    designId: body.designId,
    designType: body.designType,
    designName: body.designName,
    aiFrontImage: body.aiFrontImage,
    uploadedImageUrl: body.uploadedImageUrl,
    size: body.size,
    delivery: body.delivery,
  }

  const result = await createOrder(input, telegramUser, idempotencyKey)

  if (!result.success) {
    setResponseStatus(event, result.statusCode ?? 400)
    return { success: false, error: result.error }
  }

  if (!result.created) {
    setResponseStatus(event, 200)
    return {
      success: true,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      totalPrice: result.totalPrice,
      paymentStatus: result.paymentStatus,
      orderStatus: result.orderStatus,
      createdAt: result.createdAt,
    }
  }

  // --- TELEGRAMGA XABAR YUBORISH QISMI ---
  // Bizga API'dan faqat ID'lar kelayotgani uchun, ma'lumotlarni moslashtiramiz
  const telegramOrderData = {
    order_number: result.orderNumber,
    total_price: result.totalPrice,
    size: body.size,
    product: { name: body.productId },
    fabric: { name: body.fabricId },

    design: {
      type: body.aiFrontImage
        ? 'ai'
        : body.uploadedImageUrl
          ? 'uploaded'
          : 'existing',

      existingDesignName:
        body.designId,

      aiFrontImage:
        body.aiFrontImage || null,

      uploadedImageUrl:
        body.uploadedImageUrl || null,
    }
  }

  // Guruhga jo'natamiz (try-catch ichiga olamiz, toki xato chiqsa ham buyurtma bekor bo'lmasin)
  try {
    await sendOrderToTelegramGroup(telegramOrderData, {
      name: body.contact.name,
      phone: body.contact.phone,
      address: `${body.delivery.city}, ${body.delivery.address}`
    })
  } catch (error: any) {
    // Xatoni aniq ko'rsatish uchun error.data ni log qilamiz
    console.error('Telegramga xabar yuborishda xato yuz berdi:', error.data || error.message)
  }
  // ---------------------------------------

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