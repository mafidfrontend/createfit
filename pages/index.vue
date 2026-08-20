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
        <svg viewBox="0 0 240 280" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-full w-full">
          <defs>
            <linearGradient id="shirtBody" x1="120" y1="20" x2="120" y2="270" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#2B6BFF" />
              <stop offset="0.45" stop-color="#145DFF" />
              <stop offset="1" stop-color="#0E4AD4" />
            </linearGradient>
            <linearGradient id="shirtSleeve" x1="30" y1="40" x2="80" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#1F5AEE" />
              <stop offset="1" stop-color="#0E4AD4" />
            </linearGradient>
            <linearGradient id="shirtSleeveR" x1="210" y1="40" x2="160" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#1F5AEE" />
              <stop offset="1" stop-color="#0E4AD4" />
            </linearGradient>
            <radialGradient id="chestHighlight" cx="120" cy="110" r="70" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#fff" stop-opacity="0.12" />
              <stop offset="1" stop-color="#fff" stop-opacity="0" />
            </radialGradient>
            <filter id="softShadow" x="-20%" y="-10%" width="140%" height="130%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="8" />
              <feOffset dx="0" dy="10" result="off" />
              <feComponentTransfer><feFuncA type="linear" slope="0.18" /></feComponentTransfer>
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <g filter="url(#softShadow)">
            <!-- Left sleeve -->
            <path d="M85 30 L55 42 L25 58 L18 78 L38 92 L58 80 L80 62 Z" fill="url(#shirtSleeve)" />
            <!-- Right sleeve -->
            <path d="M155 30 L185 42 L215 58 L222 78 L202 92 L182 80 L160 62 Z" fill="url(#shirtSleeveR)" />
            <!-- Main body -->
            <path d="M85 30 Q90 52 120 52 Q150 52 155 30 L185 42 L215 58 L202 92 L188 82 L188 250 Q188 256 182 256 L58 256 Q52 256 52 250 L52 82 L38 92 L25 58 L55 42 Z" fill="url(#shirtBody)" />
            <!-- Collar -->
            <path d="M85 30 Q90 52 120 52 Q150 52 155 30" stroke="#0A3FB0" stroke-width="2.5" fill="none" stroke-linecap="round" />
            <path d="M88 33 Q92 49 120 49 Q148 49 152 33" stroke="#3B7AFF" stroke-width="1.2" fill="none" opacity="0.6" stroke-linecap="round" />
            <!-- Collar inner shadow -->
            <path d="M92 36 Q95 47 120 47 Q145 47 148 36" stroke="#0A3FB0" stroke-width="1" fill="none" opacity="0.35" />
            <!-- Chest highlight -->
            <ellipse cx="120" cy="110" rx="55" ry="40" fill="url(#chestHighlight)" />
            <!-- Fabric folds - left -->
            <path d="M62 100 Q60 140 64 180 Q66 210 68 245" stroke="#0A3FB0" stroke-width="1" fill="none" opacity="0.18" stroke-linecap="round" />
            <path d="M72 95 Q70 150 74 200 Q76 230 78 250" stroke="#0A3FB0" stroke-width="0.8" fill="none" opacity="0.12" stroke-linecap="round" />
            <!-- Fabric folds - right -->
            <path d="M178 100 Q180 140 176 180 Q174 210 172 245" stroke="#0A3FB0" stroke-width="1" fill="none" opacity="0.18" stroke-linecap="round" />
            <path d="M168 95 Q170 150 166 200 Q164 230 162 250" stroke="#0A3FB0" stroke-width="0.8" fill="none" opacity="0.12" stroke-linecap="round" />
            <!-- Center fold -->
            <path d="M120 60 L120 250" stroke="#0A3FB0" stroke-width="0.6" fill="none" opacity="0.1" />
            <!-- Sleeve fold left -->
            <path d="M42 68 Q48 76 56 80" stroke="#0A3FB0" stroke-width="0.8" fill="none" opacity="0.2" stroke-linecap="round" />
            <!-- Sleeve fold right -->
            <path d="M198 68 Q192 76 184 80" stroke="#0A3FB0" stroke-width="0.8" fill="none" opacity="0.2" stroke-linecap="round" />
            <!-- Hem stitch -->
            <path d="M58 250 L182 250" stroke="#0A3FB0" stroke-width="0.8" fill="none" opacity="0.15" stroke-dasharray="3 2" />
            <!-- Sleeve hem left -->
            <path d="M38 92 L18 78" stroke="#0A3FB0" stroke-width="0.8" fill="none" opacity="0.15" stroke-dasharray="2 2" />
            <!-- Sleeve hem right -->
            <path d="M202 92 L222 78" stroke="#0A3FB0" stroke-width="0.8" fill="none" opacity="0.15" stroke-dasharray="2 2" />
            <!-- Subtle side shadows -->
            <path d="M52 82 L52 250" stroke="#0A3FB0" stroke-width="3" fill="none" opacity="0.08" stroke-linecap="round" />
            <path d="M188 82 L188 250" stroke="#0A3FB0" stroke-width="3" fill="none" opacity="0.08" stroke-linecap="round" />
          </g>
        </svg>
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
