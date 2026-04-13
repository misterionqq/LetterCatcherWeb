<script setup>
defineProps({
  count: { type: Number, default: 3 },
})
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="i in count"
      :key="i"
      class="animate-pulse rounded-xl bg-white p-4 shadow-sm"
    >
      <div class="mb-2 h-4 w-3/4 rounded bg-gray-200" />
      <div class="mb-2 h-3 w-1/2 rounded bg-gray-200" />
      <div class="h-3 w-1/3 rounded bg-gray-200" />
    </div>
  </div>
</template>
