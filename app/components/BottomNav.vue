<script setup lang="ts">
import { NAV_ICON_PATHS } from '~/config/icons'
import { NAV_ITEMS } from '~/config/navigation'

const route = useRoute()

const isActive = (to: string): boolean => {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

const items = NAV_ITEMS
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
        <path :d="NAV_ICON_PATHS[item.icon] ?? ''" />
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
