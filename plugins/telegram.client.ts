export default defineNuxtPlugin(() => {
  const { initialize, authenticate } = useTelegram()
  onMounted(async () => {
    initialize()
    await authenticate()
  })
})
