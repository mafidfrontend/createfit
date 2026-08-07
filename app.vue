<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

const { getInitData, getUser } = useTelegram()

onMounted(async () => {
  const initData = getInitData()
  const user = getUser()

  if (!initData || !user) return

  const res = await $fetch('/api/auth/telegram', {
    method: 'POST',
    body: {
      initData
    }
  })

  console.log(res)
})