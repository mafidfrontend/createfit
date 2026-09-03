<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()
const siteUrl = config.public.siteUrl || 'https://fabrika.chat'

const canonicalUrl = computed(() => {
  return `${siteUrl}${route.path}`.replace(/\/$/, '')
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: canonicalUrl
    }
  ]
})

useHead({
  link: [
    { rel: 'canonical', href: siteUrl + '/' }
  ]
})

useSeoMeta({
  ogSiteName: 'Fabrika',
  ogType: 'website',
  ogLocale: 'ru_RU',
  ogImage: siteUrl + '/og-image.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: 'Fabrika — AI-Powered Custom Clothing',
  twitterCard: 'summary_large_image',
  twitterImage: siteUrl + '/og-image.png'
})
</script>
