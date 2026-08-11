<template>
  <div class="slide-up pb-8">
    <section class="relative min-h-[430px] overflow-hidden pt-8">
      <div class="relative z-10 max-w-[285px]">
        <h1 class="text-[34px] font-extrabold leading-[1.08] tracking-[-.045em]">Дизайн, который подходит именно тебе</h1>
        <p class="mt-5 text-[17px] leading-7 text-ink/65">Создай уникальное изделие и получи идеальную посадку без примерки</p>
        <NuxtLink to="/create" class="mt-8 block w-[174px] rounded-xl bg-sage px-4 py-3.5 text-center text-sm font-bold text-white transition hover:bg-[#0a4ad4]">Создать изделие</NuxtLink>
        <NuxtLink to="/measurements" class="mt-3 block w-[174px] rounded-xl border border-line bg-white px-4 py-3.5 text-center text-sm font-bold text-ink transition hover:border-sage">Снять мерки</NuxtLink>
      </div>
      <img class="pointer-events-none absolute -bottom-2 -right-20 z-0 h-[360px] w-[260px] object-cover object-center" src="https://images.pexels.com/photos/8346041/pexels-photo-8346041.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Стойка с одеждой нейтральных тонов" />
    </section>

    <section class="rounded-[22px] bg-[#FAFBFD] px-4 py-7">
      <h2 class="text-center text-[22px] font-extrabold tracking-[-.03em]">3 простых шага</h2>
      <div class="mt-7 grid grid-cols-3 gap-2 text-center">
        <div v-for="item in steps" :key="item.title" class="relative px-1">
          <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl text-sage">{{ item.icon }}</span>
          <h3 class="mt-4 text-sm font-bold">{{ item.title }}</h3>
          <p class="mt-2 text-xs leading-5 text-ink/55">{{ item.text }}</p>
          <span v-if="item.plus" class="absolute -right-1 top-5 text-xl text-ink/35">+</span>
        </div>
      </div>
    </section>

    <section class="mt-5 grid grid-cols-3 divide-x divide-line rounded-[22px] bg-[#FAFBFD] px-2 py-6 text-center">
      <div v-for="item in benefits" :key="item.title" class="px-2"><span class="text-2xl text-sage">{{ item.icon }}</span><h3 class="mt-3 text-sm font-bold">{{ item.title }}</h3><p class="mt-1 text-xs text-ink/55">{{ item.text }}</p></div>
    </section>
  </div>
</template>

<script setup lang="ts">
const steps = [{ icon: '◇', title: 'Дизайн', text: 'Создай изделие своей мечты', plus: true }, { icon: '◳', title: 'Мерки', text: '2 фото и точные измерения', plus: true }, { icon: '✓', title: 'Заказ', text: 'Мы шьём и доставляем', plus: false }]
const benefits = [{ icon: '◇', title: 'Индивидуально', text: 'Точно по фигуре' }, { icon: '◳', title: 'Онлайн', text: 'Без примерки' }, { icon: '◷', title: 'Быстро', text: 'От 7 дней' }]
</script>
