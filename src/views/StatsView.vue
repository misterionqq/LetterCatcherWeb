<script setup>
import { computed, onMounted } from 'vue'
import { useNotificationsStore } from '@/stores/notifications.js'

const notificationsStore = useNotificationsStore()

const importantPercent = computed(() => {
  if (!notificationsStore.stats || !notificationsStore.stats.total_processed) return '0'
  return ((notificationsStore.stats.important_count / notificationsStore.stats.total_processed) * 100).toFixed(1)
})

onMounted(() => {
  notificationsStore.fetchStats()
})
</script>

<template>
  <div class="px-4 py-4">
    <h1 class="mb-4 text-xl font-bold text-gray-900">Статистика</h1>

    <div v-if="notificationsStore.stats" class="space-y-3">
      <div class="rounded-xl bg-white p-5 shadow-sm">
        <p class="text-3xl font-bold text-gray-900">{{ notificationsStore.stats.total_processed }}</p>
        <p class="mt-1 text-sm text-gray-500">Всего обработано</p>
      </div>

      <div class="rounded-xl bg-white p-5 shadow-sm">
        <div class="flex items-baseline gap-2">
          <p class="text-3xl font-bold text-warning">{{ notificationsStore.stats.important_count }}</p>
          <span class="text-sm text-gray-400">{{ importantPercent }}%</span>
        </div>
        <p class="mt-1 text-sm text-gray-500">Важных</p>
      </div>

      <div class="rounded-xl bg-white p-5 shadow-sm">
        <p class="text-3xl font-bold text-gray-900">{{ notificationsStore.stats.cache_total }}</p>
        <p class="mt-1 text-sm text-gray-500">Записей в AI-кэше</p>
      </div>
    </div>

    <div v-else class="space-y-3">
      <div v-for="i in 3" :key="i" class="animate-pulse rounded-xl bg-white p-5 shadow-sm">
        <div class="h-8 w-20 rounded bg-gray-200" />
        <div class="mt-2 h-4 w-32 rounded bg-gray-200" />
      </div>
    </div>
  </div>
</template>
