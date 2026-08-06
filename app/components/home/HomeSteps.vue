<script setup lang="ts">
const steps = [
  {
    icon: 'M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M3 12h3m12 0h3M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1',
    label: 'Опиши дизайн',
    description: 'Расскажи, что хочешь создать',
  },
  {
    icon: 'M4 16l4.58-4.58a2 2 0 012.83 0L16 16m-2-2l1.58-1.58a2 2 0 012.83 0L20 14m-6-6h.01M14 8h.01',
    label: 'Сними мерки',
    description: 'AI измерит тебя по фото',
  },
  {
    icon: 'M5 13l4 4L19 7',
    label: 'Получи результат',
    description: 'Готовая одежда по твоему дизайну',
  },
]
</script>

<template>
  <section class="bg-neutral-50 px-5 py-10">
    <h2 class="text-center text-xl font-bold text-neutral-900">
      3 простых шага
    </h2>

    <div class="mt-8 flex items-stretch justify-between gap-1">
      <div
        v-for="(step, index) in steps"
        :key="index"
        class="flex flex-1 flex-col items-center text-center"
      >
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
          <svg
            class="h-7 w-7 text-primary-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path :d="step.icon" />
          </svg>
        </div>
        <span class="mt-3 text-sm font-bold text-neutral-900">{{ step.label }}</span>
        <span class="mt-1 text-[11px] leading-tight text-neutral-500">{{ step.description }}</span>
      </div>
    </div>
  </section>
</template>
