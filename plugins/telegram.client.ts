export default defineNuxtPlugin(() => {
  const { initialize } = useTelegram()
  onMounted(initialize)
})
