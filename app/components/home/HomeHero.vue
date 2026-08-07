<script setup lang="ts">
import AppButton from '~/components/AppButton.vue'

const tshirtImage = 'https://images.pexels.com/photos/37704843/pexels-photo-37704843.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
</script>

<template>
  <section class="relative overflow-hidden px-5 pt-8 pb-10">
    <div class="relative z-10 max-w-[75%]">
      <h1 class="text-[32px] font-extrabold leading-[1.1] tracking-tight text-neutral-900">
        Создай свой
        <br />
        уникальный стиль
      </h1>
      <p class="mt-3 text-sm leading-relaxed text-neutral-500">
        Дизайн одежды с помощью
        <br />
        искусственного интеллекта
      </p>

      <div class="mt-7 flex flex-col gap-3">
        <AppButton size="lg" full-width to="/create">
          Начать дизайн
        </AppButton>
        <AppButton variant="outline" size="lg" full-width to="/measurements">
          Снять мерки
        </AppButton>
      </div>
    </div>

    <div class="absolute -right-16 top-4 h-64 w-64">
      <img
        :src="tshirtImage"
        alt="Футболка"
        class="h-full w-full rounded-3xl object-cover opacity-90"
        loading="eager"
      />
      <div class="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white" />
    </div>
  </section>
</template>
