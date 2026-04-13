import { ref, onUnmounted } from 'vue'
import { getServerUrl } from '@/utils/serverUrl.js'

export function useWebSocket(token, onMessage) {
  const status = ref('disconnected')
  let ws = null
  let shouldReconnect = true

  function connect() {
    const baseUrl = getServerUrl()
    if (!baseUrl) return
    const wsUrl = baseUrl.replace(/^http/, 'ws') + `/ws?token=${token}`

    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      status.value = 'connected'
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
      if (event.code === 4001) {
        shouldReconnect = false
        localStorage.removeItem('access_token')
        window.location.replace('/login')
        return
      }
      if (shouldReconnect) {
        setTimeout(connect, 5000)
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  }

  function close() {
    shouldReconnect = false
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
