<script setup>
defineProps({
  loading: { type: Boolean, default: false },
  variant: { type: String, default: 'primary' },
  type: { type: String, default: 'button' },
})
</script>

<template>
  <button
    :type="type"
    :disabled="loading"
    class="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
    :class="{
      'bg-primary text-white hover:bg-blue-600': variant === 'primary',
      'bg-gray-200 text-gray-700 hover:bg-gray-300': variant === 'secondary',
      'bg-danger text-white hover:bg-red-600': variant === 'danger',
    }"
  >
    <svg
      v-if="loading"
      class="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
    <slot />
  </button>
</template>
