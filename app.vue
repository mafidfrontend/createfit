<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const siteUrl = config.public.siteUrl as string

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
