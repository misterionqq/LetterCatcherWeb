<script setup>
import { useToast } from '@/composables/useToast.js'

const { toasts, removeToast } = useToast()
</script>

<template>
  <div class="fixed right-4 top-4 z-[100] flex flex-col gap-2">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg"
        :class="{
          'bg-success text-white': toast.type === 'success',
          'bg-danger text-white': toast.type === 'error',
          'bg-primary text-white': toast.type === 'info',
        }"
        @click="removeToast(toast.id)"
      >
        {{ toast.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease;
}
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
