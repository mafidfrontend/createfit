<script setup lang="ts">
const advantages = [
  {
    icon: 'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 4h6a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V5a1 1 0 011-1z',
    label: 'Уникальный дизайн',
    description: 'Создавай одежду по своему вкусу',
  },
  {
    icon: 'M12 18a6 6 0 100-12 6 6 0 000 12zM12 10v4M12 8h.01',
    label: 'Точные мерки',
    description: 'AI измеряет с точностью до сантиметра',
  },
  {
    icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    label: 'Быстрая доставка',
    description: 'Готово за 5-7 дней',
  },
]
</script>

<template>
  <section class="px-5 py-10">
    <h2 class="text-xl font-bold text-neutral-900">Почему CreateFit</h2>

    <div class="mt-5 grid grid-cols-3 gap-3">
      <div
        v-for="(advantage, index) in advantages"
        :key="index"
        class="flex flex-col items-center rounded-2xl bg-neutral-50 p-4 text-center"
      >
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
          <svg
            class="h-6 w-6 text-primary-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path :d="advantage.icon" />
          </svg>
        </div>
        <span class="mt-3 text-xs font-bold leading-tight text-neutral-900">{{ advantage.label }}</span>
        <span class="mt-1 text-[10px] leading-tight text-neutral-500">{{ advantage.description }}</span>
      </div>
    </div>
  </section>
</template>
