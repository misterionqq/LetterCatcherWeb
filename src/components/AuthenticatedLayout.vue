<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
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

const resendLoading = ref(false)
let wsClose = null

function handleWsMessage(data) {
  if (data.type === 'email_notification') {
    notificationsStore.addEmail(data)
    if (data.is_important) {
      addToast(data.subject || 'Новое важное письмо', 'info')
    }
  }
}

async function handleResend() {
  resendLoading.value = true
  try {
    const result = await authStore.resendVerification()
    addToast(result.message || 'Письмо отправлено', 'success')
  } catch (e) {
    if (e.rateLimited) {
      addToast('Слишком много попыток. Подождите минуту.', 'error')
    } else if (e.response?.status === 400) {
      addToast('Email уже подтверждён', 'info')
      await profileStore.fetchProfile()
    } else {
      addToast('Ошибка отправки', 'error')
    }
  } finally {
    resendLoading.value = false
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
    <!-- Email not verified banner -->
    <div
      v-if="profileStore.profile && profileStore.profile.email_verified === false"
      class="bg-amber-50 border-b border-amber-200 px-4 py-2.5"
    >
      <div class="flex items-center justify-between gap-2 text-xs text-amber-800">
        <div class="flex items-center gap-2">
          <svg class="h-4 w-4 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Email не подтверждён</span>
        </div>
        <button
          class="shrink-0 font-medium underline hover:text-amber-900 disabled:opacity-50"
          :disabled="resendLoading"
          @click="handleResend"
        >
          {{ resendLoading ? 'Отправка...' : 'Отправить повторно' }}
        </button>
      </div>
    </div>
    <router-view />
    <BottomNav />
    <ToastContainer />
  </div>
</template>
