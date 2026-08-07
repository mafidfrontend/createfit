<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    fullWidth?: boolean
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
    to?: RouteLocationRaw
    ariaLabel?: string
  }>(),
  {
    variant: 'primary',
    size: 'md',
    fullWidth: false,
    loading: false,
    disabled: false,
    type: 'button',
    to: undefined,
  },
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary-600 text-white active:bg-primary-700 shadow-sm shadow-primary-600/30',
  secondary: 'bg-neutral-100 text-neutral-900 active:bg-neutral-200',
  outline: 'bg-white border-2 border-primary-600 text-primary-600 active:bg-primary-50',
  ghost: 'bg-transparent text-neutral-700 active:bg-neutral-100',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-5 text-[15px]',
  lg: 'h-14 px-6 text-base',
}

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 tap-scale',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
  variantClasses[props.variant],
  sizeClasses[props.size],
  props.fullWidth ? 'w-full' : '',
  props.disabled || props.loading ? 'opacity-50 pointer-events-none' : '',
])

function handleClick(event: MouseEvent) {
  if (props.disabled || props.loading) return
  emit('click', event)
}
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    :class="classes"
    :aria-disabled="disabled || loading"
  >
    <svg
      v-if="loading"
      class="animate-spin h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot />
  </NuxtLink>

  <button
    v-else
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    :aria-label="ariaLabel"
    :aria-busy="loading"
    @click="handleClick"
  >
    <svg
      v-if="loading"
      class="animate-spin h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot />
  </button>
</template>
