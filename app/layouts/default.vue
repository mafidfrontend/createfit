<script setup lang="ts">
import { useTelegram } from '~/composables/useTelegram'
import MenuDrawer from '~/components/MenuDrawer.vue'

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
  <div class="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-white">
    <slot />
    <MenuDrawer />
  </div>
</template>
