<script setup lang="ts">
import { useTelegram } from '~/composables/useTelegram'

const { init } = useTelegram()
const userStore = useUserStore()

init()

onMounted(() => {
  const tg = window.Telegram?.WebApp
  if (tg?.initDataUnsafe?.user) {
    userStore.setTelegramUser(tg.initDataUnsafe.user)
  }
})
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-md flex-col bg-white">
    <slot />
  </div>
</template>
