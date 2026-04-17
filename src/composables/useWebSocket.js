import { ref, onUnmounted } from 'vue'
import { getServerUrl } from '@/utils/serverUrl.js'
import { useAuthStore } from '@/stores/auth.js'

const INITIAL_BACKOFF = 1000
const MAX_BACKOFF = 30000

export function useWebSocket(token, onMessage) {
  const status = ref('disconnected')
  const authStore = useAuthStore()
  let ws = null
  let shouldReconnect = true
  let backoff = INITIAL_BACKOFF
  let reconnectTimer = null

  function connect() {
    const baseUrl = getServerUrl()
    if (!baseUrl) return
    const wsUrl = baseUrl.replace(/^http/, 'ws') + `/ws?token=${token}`

    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      status.value = 'connected'
      backoff = INITIAL_BACKOFF
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch {
        // ignore non-JSON messages
      }
    }

    ws.onclose = (event) => {
      status.value = 'disconnected'
      if (event.code === 4001 || event.code === 4003) {
        shouldReconnect = false
        authStore.logout()
        return
      }
      scheduleReconnect()
    }

    ws.onerror = () => {
      ws.close()
    }
  }

  function scheduleReconnect() {
    if (!shouldReconnect) return
    status.value = 'reconnecting'
    reconnectTimer = setTimeout(() => {
      backoff = Math.min(backoff * 2, MAX_BACKOFF)
      connect()
    }, backoff)
  }

  function close() {
    shouldReconnect = false
    clearTimeout(reconnectTimer)
    if (ws) {
      ws.close()
    }
  }

  connect()

  onUnmounted(() => {
    close()
  })

  return { status, close }
}
