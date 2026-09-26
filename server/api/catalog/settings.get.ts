import { getStoreSettings } from '~/server/services/catalog'

export default defineEventHandler(async () => {
  return {
    settings: await getStoreSettings(),
  }
})
