<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNotificationsStore } from '@/stores/notifications.js'
import { getHealth } from '@/api/health.js'
import HealthIndicator from '@/components/HealthIndicator.vue'
import EmailCard from '@/components/EmailCard.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'

const router = useRouter()
const route = useRoute()
const store = useNotificationsStore()

const health = ref(null)
const tab = ref(route.query.tab === 'all' ? 'all' : 'important')
const refreshing = ref(false)

// Pull-to-refresh state
const pullStartY = ref(0)
const pullDistance = ref(0)
const PULL_THRESHOLD = 70

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

function setTab(value) {
  tab.value = value
  router.replace({ query: value === 'important' ? {} : { tab: value } })
}

function openEmail(email) {
  router.push(`/emails/${email.email_uid}`)
}

async function refresh() {
  if (refreshing.value) return
  refreshing.value = true
  try {
    await store.fetchHistory(50)
    getHealth().then((data) => (health.value = data)).catch(() => {})
  } finally {
    refreshing.value = false
  }
}

// Pull-to-refresh handlers
function onTouchStart(e) {
  if (window.scrollY === 0) {
    pullStartY.value = e.touches[0].clientY
  }
}

function onTouchMove(e) {
  if (!pullStartY.value) return
  const dy = e.touches[0].clientY - pullStartY.value
  if (dy > 0 && window.scrollY === 0) {
    pullDistance.value = Math.min(dy, PULL_THRESHOLD + 30)
  }
}

function onTouchEnd() {
  if (pullDistance.value >= PULL_THRESHOLD) {
    refresh()
  }
  pullDistance.value = 0
  pullStartY.value = 0
}

onMounted(() => {
  getHealth().then((data) => (health.value = data)).catch(() => {})
  store.fetchHistory(50)
})
</script>

<template>
  <div
    class="px-4 py-4"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend.passive="onTouchEnd"
  >
    <!-- Pull-to-refresh indicator -->
    <div
      class="flex items-center justify-center overflow-hidden transition-all duration-150"
      :style="{ height: pullDistance > 0 ? pullDistance + 'px' : '0px' }"
    >
      <svg
        class="h-6 w-6 text-primary transition-transform duration-200"
        :class="{ 'animate-spin': refreshing, 'rotate-180': pullDistance >= PULL_THRESHOLD && !refreshing }"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </div>

    <!-- Header with refresh button -->
    <div class="mb-3 flex items-center justify-between">
      <HealthIndicator :status="health" class="flex-1" />
      <button
        class="ml-2 p-1.5 text-gray-400 active:text-primary disabled:opacity-40"
        :disabled="refreshing || store.loading"
        @click="refresh"
        title="Обновить"
      >
        <svg
          class="h-5 w-5"
          :class="{ 'animate-spin': refreshing || store.loading }"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>

    <!-- Tabs -->
    <div class="mb-4 flex rounded-lg bg-gray-100 p-1">
      <button
        class="flex-1 rounded-md py-2 text-sm font-medium transition-colors"
        :class="tab === 'important' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'"
        @click="setTab('important')"
      >
        Важные
      </button>
      <button
        class="flex-1 rounded-md py-2 text-sm font-medium transition-colors"
        :class="tab === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'"
        @click="setTab('all')"
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
