<script setup lang="ts">
import { NAV_ITEMS } from '~/config/navigation'

const route = useRoute()

const isActive = (to: string): boolean => {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

const items = NAV_ITEMS

const iconPaths: Record<string, string> = {
  home: 'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V9.5z',
  sparkles: 'M12 3l1.5 5L19 9.5 13.5 11 12 16l-1.5-5L5 9.5 10.5 8 12 3z',
  ruler: 'M3 17L17 3l4 4L7 21l-4-4zM7 9l2 2M11 5l2 2M9 11l2 2',
  'shopping-bag': 'M6 7h12l1 13H5L6 7zM9 7V5a3 3 0 016 0v2',
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-neutral-100 bg-white/95 backdrop-blur-md px-2 pb-[env(safe-area-inset-bottom)]"
    role="navigation"
    aria-label="Нижняя навигация"
  >
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors"
      :aria-label="item.label"
      :aria-current="isActive(item.to) ? 'page' : undefined"
    >
      <svg
        class="h-6 w-6 transition-colors duration-200"
        :class="isActive(item.to) ? 'text-primary-600' : 'text-neutral-400'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path :d="iconPaths[item.icon]" />
      </svg>
      <span
        class="text-[10px] font-medium transition-colors duration-200"
        :class="isActive(item.to) ? 'text-primary-600' : 'text-neutral-400'"
      >
        {{ item.label }}
      </span>
    </NuxtLink>
  </nav>
</template>
