<template>
  <div class="slide-up pb-8">
    <!-- Hero -->
    <section class="relative overflow-hidden pt-6">
      <div class="relative z-10 max-w-[300px]">
        <h1 class="text-[34px] font-extrabold leading-[1.08] tracking-[-.045em]">Дизайн, который подходит именно тебе</h1>
        <p class="mt-5 text-[17px] leading-7 text-ink/65">Создай уникальное изделие и получи идеальную посадку без примерки</p>
        <NuxtLink to="/create" class="mt-8 block w-[174px] rounded-xl bg-sage px-4 py-3.5 text-center text-sm font-bold text-white transition hover:bg-[#0a4ad4]">Создать дизайн</NuxtLink>
        <div class="mt-3 flex gap-3">
          <NuxtLink to="/measurements" class="block w-[174px] rounded-xl border border-line bg-white px-4 py-3.5 text-center text-sm font-bold text-ink transition hover:border-sage">Снять мерки</NuxtLink>
          <NuxtLink to="/orders" class="flex w-[174px] items-center justify-center rounded-xl border border-line bg-white px-4 py-3.5 text-center text-sm font-bold text-ink transition hover:border-sage">Мои заказы</NuxtLink>
        </div>
      </div>
      <!-- T-shirt visual -->
      <div class="pointer-events-none absolute -bottom-2 -right-12 z-0 h-[380px] w-[320px]">
        <img :src="'/images/image.png'" alt="Пример готового изделия Fabrika — футболка с AI-дизайном" class="h-full w-full object-contain object-center drop-shadow-[0_18px_28px_rgba(20,93,255,0.16)]" />
      </div>
    </section>

    <!-- 3 Steps -->
    <section class="mt-6 rounded-[22px] bg-[#FAFBFD] px-4 py-7">
      <h2 class="text-center text-[22px] font-extrabold tracking-[-.03em]">3 простых шага</h2>
      <div class="mt-7 grid grid-cols-3 gap-2 text-center">
        <div v-for="(item, i) in steps" :key="item.title" class="relative px-1">
          <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl text-sage shadow-sm">{{ i + 1 }}</span>
          <h3 class="mt-4 text-sm font-bold">{{ item.title }}</h3>
          <p class="mt-2 text-xs leading-5 text-ink/55">{{ item.text }}</p>
          <span v-if="i < steps.length - 1" class="absolute -right-1 top-5 text-xl text-ink/25">→</span>
        </div>
      </div>
    </section>

    <!-- Benefits -->
    <section class="mt-5 grid grid-cols-3 divide-x divide-line rounded-[22px] bg-[#FAFBFD] px-2 py-6 text-center">
      <div v-for="item in benefits" :key="item.title" class="px-2">
        <span class="text-2xl text-sage">{{ item.icon }}</span>
        <h3 class="mt-3 text-sm font-bold">{{ item.title }}</h3>
        <p class="mt-1 text-xs text-ink/55">{{ item.text }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')

useSeoMeta({
  title: 'Fabrika — AI-Powered Custom Clothing',
  description: 'Создай уникальное изделие с помощью AI и получи идеальную посадку без примерки. Дизайн, мерки и заказ — всё онлайн на Fabrika.',
  keywords: 'AI fashion, custom clothing, дизайн одежды, индивидуальный пошив, AI дизайн, мерки онлайн',
  ogTitle: 'Fabrika — AI-Powered Custom Clothing',
  ogDescription: 'Create unique clothing designs with AI and get the perfect fit without a fitting room.',
  ogUrl: siteUrl + '/',
  ogType: 'website',
  twitterTitle: 'Fabrika — AI-Powered Custom Clothing',
  twitterDescription: 'Create unique clothing designs with AI and get the perfect fit without a fitting room.'
})

useHead({
  titleTemplate: '',
  link: [{ rel: 'canonical', href: siteUrl + '/' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Fabrika',
        url: siteUrl + '/',
        logo: siteUrl + '/icon-512.png',
        description: 'AI-powered fashion platform for custom clothing design.'
      })
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Fabrika',
        url: siteUrl + '/'
      })
    }
  ]
})

const steps = [
  { title: 'Дизайн', text: 'Создай свой уникальный дизайн' },
  { title: 'Мерки', text: '2 минуты на точные измерения' },
  { title: 'Заказ', text: 'Мы шьём и доставляем' }
]
const benefits = [
  { icon: '◇', title: 'Индивидуально', text: 'Точно по фигуре' },
  { icon: '◳', title: 'Онлайн', text: 'Без примерки' },
  { icon: '◷', title: 'Быстро', text: 'От 7 дней' }
]
</script>
