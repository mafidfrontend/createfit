import { getActiveFabrics } from '~/server/services/catalog'

export default defineEventHandler(async () => {
  return {
    fabrics: await getActiveFabrics(),
  }
})
