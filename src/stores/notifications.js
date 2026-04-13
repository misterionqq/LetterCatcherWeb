import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as emailsApi from '@/api/emails.js'

export const useNotificationsStore = defineStore('notifications', () => {
  // Full emails from WebSocket (have body_full, links, attachments, etc.)
  const emails = ref([])

  // Metadata-only records from GET /emails/history
  const historyMeta = ref([])

  const pendingDnd = ref([])
  const stats = ref(null)
  const loading = ref(false)

  async function fetchHistory(limit = 50) {
    loading.value = true
    try {
      historyMeta.value = await emailsApi.getHistory(limit)
    } finally {
      loading.value = false
    }
  }

  async function fetchStats() {
    stats.value = await emailsApi.getStats()
  }

  function addEmail(email) {
    if (!emails.value.some((e) => e.email_uid === email.email_uid)) {
      emails.value.unshift(email)
    }
  }

  function getEmailByUid(uid) {
    return emails.value.find((e) => e.email_uid === uid)
      || historyMeta.value.find((e) => e.email_uid === uid)
      || null
  }

  function isFullEmail(uid) {
    const e = getEmailByUid(uid)
    return !!(e && (e.body_html || e.body_full))
  }

  function setPendingDnd(list) {
    pendingDnd.value = list
  }

  return {
    emails,
    historyMeta,
    pendingDnd,
    stats,
    loading,
    fetchHistory,
    fetchStats,
    addEmail,
    getEmailByUid,
    isFullEmail,
    setPendingDnd,
  }
})
