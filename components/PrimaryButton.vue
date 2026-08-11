<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="flex w-full items-center justify-center gap-2 rounded-xl bg-sage px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#0a4ad4] active:scale-[.99] disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:text-[#64748B]"
    @click="$emit('click')"
  >
    <svg v-if="loading" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
    <span v-if="loading">Подождите...</span>
    <span v-else><slot /></span>
  </button>
</template>
<script setup lang="ts">
defineProps<{ disabled?: boolean; loading?: boolean; type?: 'button' | 'submit' }>()
defineEmits<{ click: [] }>()
</script>
