export default defineNuxtPlugin(() => {
  if (!process.client) return

  const tg = window.Telegram?.WebApp

  if (!tg) return

  tg.ready()
  tg.expand()

  return {
    provide: {
      telegram: tg
    }
  }
})