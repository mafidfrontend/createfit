import { getActiveProducts } from '~/server/services/catalog'

export default defineEventHandler(async () => {
  return {
    products: await getActiveProducts(),
  }
})
