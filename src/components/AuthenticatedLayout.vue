<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { useProfileStore } from '@/stores/profile.js'
import { useNotificationsStore } from '@/stores/notifications.js'
import { useWebSocket } from '@/composables/useWebSocket.js'
import { useToast } from '@/composables/useToast.js'
import { usePushNotifications } from '@/composables/usePushNotifications.js'
import BottomNav from './BottomNav.vue'
import ToastContainer from './ToastContainer.vue'

const authStore = useAuthStore()
const profileStore = useProfileStore()
const notificationsStore = useNotificationsStore()
const { addToast } = useToast()
const { register: registerPush } = usePushNotifications()

let wsClose = null

function handleWsMessage(data) {
  if (data.type === 'email_notification') {
    notificationsStore.addEmail(data)
    if (data.is_important) {
      addToast(data.subject || 'Новое важное письмо', 'info')
    }
  }
}

onMounted(async () => {
  try {
    await profileStore.fetchProfile()
  } catch (e) {
    if (e.response?.status !== 401) {
      authStore.logout()
    }
    return
  }
  notificationsStore.fetchHistory(50)
  registerPush()
  if (authStore.token) {
    const { close } = useWebSocket(authStore.token, handleWsMessage)
    wsClose = close
  }
})

onUnmounted(() => {
  if (wsClose) wsClose()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-16">
    <router-view />
    <BottomNav />
    <ToastContainer />
  </div>
</template>
