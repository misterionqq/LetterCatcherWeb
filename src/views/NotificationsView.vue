<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '@/stores/notifications.js'
import { getHealth } from '@/api/health.js'
import HealthIndicator from '@/components/HealthIndicator.vue'
import EmailCard from '@/components/EmailCard.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'

const router = useRouter()
const store = useNotificationsStore()

const health = ref(null)
const tab = ref('important')

// Merge WS emails + history meta, deduplicate by email_uid, sort newest first
const allEmails = computed(() => {
  const map = new Map()
  // WS emails first (full data)
  for (const e of store.emails) {
    map.set(e.email_uid, e)
  }
  // History meta fills gaps
  for (const e of store.historyMeta) {
    if (!map.has(e.email_uid)) {
      map.set(e.email_uid, e)
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const da = new Date(a.date || a.processed_at || 0)
    const db = new Date(b.date || b.processed_at || 0)
    return db - da
  })
})

const filteredEmails = computed(() => {
  if (tab.value === 'important') {
    return allEmails.value.filter((e) => e.is_important)
  }
  return allEmails.value
})

function openEmail(email) {
  router.push(`/emails/${email.email_uid}`)
}

onMounted(() => {
  getHealth().then((data) => (health.value = data)).catch(() => {})
  store.fetchHistory(50)
})
</script>

<template>
  <div class="px-4 py-4">
    <!-- Health indicator -->
    <HealthIndicator :status="health" class="mb-3" />

    <!-- Tabs -->
    <div class="mb-4 flex rounded-lg bg-gray-100 p-1">
      <button
        class="flex-1 rounded-md py-2 text-sm font-medium transition-colors"
        :class="tab === 'important' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'"
        @click="tab = 'important'"
      >
        Важные
      </button>
      <button
        class="flex-1 rounded-md py-2 text-sm font-medium transition-colors"
        :class="tab === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'"
        @click="tab = 'all'"
      >
        Все
      </button>
    </div>

    <!-- Loading -->
    <SkeletonLoader v-if="store.loading && !allEmails.length" />

    <!-- Email list -->
    <template v-else-if="filteredEmails.length">
      <div class="space-y-3">
        <EmailCard
          v-for="email in filteredEmails"
          :key="email.email_uid"
          :email="email"
          @click="openEmail"
        />
      </div>
    </template>

    <!-- Empty state -->
    <div v-else class="mt-12 text-center">
      <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5-1.47a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75a2.25 2.25 0 012.25-2.25h15a2.25 2.25 0 012.25 2.25v9z" />
      </svg>
      <p class="mt-3 text-sm text-gray-400">
        {{ tab === 'important' ? 'Важных писем пока нет' : 'Писем пока нет' }}
      </p>
    </div>
  </div>
</template>
