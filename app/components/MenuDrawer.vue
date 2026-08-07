<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { NAV_ITEMS } from '~/config/navigation'
import { NAV_ICON_PATHS } from '~/config/icons'
import { useTelegram } from '~/composables/useTelegram'

const uiStore = useUiStore()
const router = useRouter()
const route = useRoute()
const { haptic } = useTelegram()

const isOpen = computed(() => uiStore.menuOpen)

const isActive = (to: string): boolean => {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

function navigate(to: string) {
  haptic('light')
  uiStore.closeMenu()
  router.push(to)
}

function close() {
  uiStore.closeMenu()
}

watch(isOpen, (open) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = open ? 'hidden' : ''
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="menu">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Меню навигации">
        <div class="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" @click="close" />

        <div class="relative ml-auto flex h-full w-[80%] max-w-xs flex-col bg-white shadow-2xl">
          <div class="flex h-16 items-center justify-between border-b border-neutral-100 px-5">
            <span class="text-xl font-extrabold tracking-tight text-neutral-900">CreateFit</span>
            <button
              class="flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors active:bg-neutral-100"
              aria-label="Закрыть меню"
              @click="close"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Меню навигации">
            <button
              v-for="item in NAV_ITEMS"
              :key="item.to"
              class="mb-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors"
              :class="isActive(item.to) ? 'bg-primary-50 text-primary-700' : 'text-neutral-700 active:bg-neutral-100'"
              :aria-current="isActive(item.to) ? 'page' : undefined"
              @click="navigate(item.to)"
            >
              <svg
                class="h-6 w-6"
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
              <span class="text-[15px] font-semibold">{{ item.label }}</span>
            </button>
          </nav>

          <div class="border-t border-neutral-100 px-5 py-4">
            <p class="text-xs font-medium tracking-wide text-neutral-400">Made by SAIKO</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.25s ease;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
}
</style>
