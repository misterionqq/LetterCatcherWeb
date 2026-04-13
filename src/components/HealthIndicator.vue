<script setup>
defineProps({
  status: { type: Object, default: null },
})
</script>

<template>
  <div class="flex items-center gap-2 rounded-lg bg-white px-4 py-3 shadow-sm">
    <span
      class="h-2.5 w-2.5 rounded-full"
      :class="status?.scanner === 'running' ? 'bg-success' : 'bg-gray-400'"
    />
    <span class="text-sm text-gray-600">
      {{ status?.scanner === 'running' ? 'Сканер запущен' : 'Сканер остановлен' }}
    </span>
  </div>
</template>
