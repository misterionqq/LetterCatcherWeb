<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { useAuthStore } from '@/stores/auth.js'
import { useToast } from '@/composables/useToast.js'
import { getServerUrl, setServerUrl, isServerConfigured } from '@/utils/serverUrl.js'
import BaseButton from '@/components/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const { addToast } = useToast()

const isNative = Capacitor.isNativePlatform()

// Server config
const showServerConfig = ref(false)
const serverInput = ref('')
const serverSaved = ref(false)

// Auth form
const activeTab = ref('login')
const email = ref('')
const password = ref('')
const telegramId = ref('')
const showTelegram = ref(false)
const loading = ref(false)
const errors = ref({})

onMounted(() => {
  const current = getServerUrl()
  if (current) {
    // Show without /api/v1 suffix for cleaner display
    serverInput.value = current.replace(/\/api\/v1$/, '')
    serverSaved.value = true
  }
  // On mobile, if not configured — force server config first
  if (isNative && !isServerConfigured()) {
    showServerConfig.value = true
  }
})

function saveServer() {
  const url = serverInput.value.trim()
  if (!url) {
    errors.value.server = 'Введите адрес сервера'
    return
  }
  try {
    new URL(url)
  } catch {
    errors.value.server = 'Некорректный URL (пример: https://example.com)'
    return
  }
  errors.value.server = null
  setServerUrl(url)
  serverSaved.value = true
  showServerConfig.value = false
  addToast('Сервер сохранён', 'success')
}

function validate() {
  errors.value = {}
  if (!email.value.trim()) {
    errors.value.email = 'Введите email'
  } else if (!/\S+@\S+\.\S+/.test(email.value)) {
    errors.value.email = 'Некорректный email'
  }
  if (!password.value) {
    errors.value.password = 'Введите пароль'
  } else if (password.value.length < 8) {
    errors.value.password = 'Минимум 8 символов'
  }
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!isServerConfigured()) {
    showServerConfig.value = true
    return
  }
  if (!validate()) return
  loading.value = true
  errors.value = {}
  try {
    if (activeTab.value === 'login') {
      await authStore.login(email.value, password.value)
    } else {
      await authStore.register(email.value, password.value)
    }
    router.push('/')
  } catch (e) {
    const status = e.response?.status
    if (status === 401) {
      errors.value.general = 'Неверный email или пароль'
    } else if (status === 409) {
      errors.value.email = 'Email уже зарегистрирован'
    } else if (status === 422) {
      const detail = e.response?.data?.detail
      if (Array.isArray(detail)) {
        errors.value.general = detail.map((d) => d.msg).join(', ')
      } else {
        errors.value.general = 'Ошибка валидации'
      }
    } else {
      addToast('Сервер недоступен, попробуйте позже', 'error')
    }
  } finally {
    loading.value = false
  }
}

async function handleTelegramLogin() {
  if (!isServerConfigured()) {
    showServerConfig.value = true
    return
  }
  if (!telegramId.value.trim()) {
    errors.value.telegram = 'Введите Telegram ID'
    return
  }
  loading.value = true
  errors.value = {}
  try {
    await authStore.telegramLogin(Number(telegramId.value))
    router.push('/')
  } catch (e) {
    if (e.response?.status === 404) {
      errors.value.telegram = 'Пользователь не найден, зарегистрируйтесь через бот'
    } else {
      addToast('Сервер недоступен, попробуйте позже', 'error')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md">
      <h1 class="mb-8 text-center text-2xl font-bold text-gray-900">LetterCatcher</h1>

      <!-- Server config block (shown first on mobile if not configured) -->
      <div v-if="showServerConfig" class="mb-4 rounded-2xl bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">Адрес сервера</h2>
        <div class="space-y-3">
          <input
            v-model="serverInput"
            type="url"
            class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="https://example.com"
          />
          <p v-if="errors.server" class="text-xs text-danger">{{ errors.server }}</p>
          <BaseButton class="w-full" @click="saveServer">
            Сохранить
          </BaseButton>
        </div>
      </div>

      <!-- Main auth card -->
      <div v-if="!showServerConfig || serverSaved" class="rounded-2xl bg-white p-6 shadow-sm">
        <!-- Server indicator -->
        <button
          class="mb-4 flex w-full items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-left text-xs text-gray-500 hover:bg-gray-100 transition-colors"
          @click="showServerConfig = !showServerConfig"
        >
          <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
          <span class="truncate">{{ serverSaved ? serverInput || 'localhost' : 'Сервер не настроен' }}</span>
          <svg class="ml-auto h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>

        <!-- Tabs -->
        <div class="mb-6 flex rounded-lg bg-gray-100 p-1">
          <button
            class="flex-1 rounded-md py-2 text-sm font-medium transition-colors"
            :class="activeTab === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'"
            @click="activeTab = 'login'; errors = {}"
          >
            Вход
          </button>
          <button
            class="flex-1 rounded-md py-2 text-sm font-medium transition-colors"
            :class="activeTab === 'register' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'"
            @click="activeTab = 'register'; errors = {}"
          >
            Регистрация
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              v-model="email"
              type="email"
              class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="user@company.com"
            />
            <p v-if="errors.email" class="mt-1 text-xs text-danger">{{ errors.email }}</p>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Пароль</label>
            <input
              v-model="password"
              type="password"
              class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Минимум 8 символов"
            />
            <p v-if="errors.password" class="mt-1 text-xs text-danger">{{ errors.password }}</p>
          </div>

          <p v-if="errors.general" class="text-sm text-danger">{{ errors.general }}</p>

          <BaseButton type="submit" :loading="loading" class="w-full">
            {{ activeTab === 'login' ? 'Войти' : 'Зарегистрироваться' }}
          </BaseButton>
        </form>

        <!-- Telegram login -->
        <div class="mt-6 border-t border-gray-100 pt-4">
          <button
            class="w-full text-center text-sm text-primary hover:underline"
            @click="showTelegram = !showTelegram"
          >
            Войти через Telegram-бот
          </button>

          <div v-if="showTelegram" class="mt-3 space-y-3">
            <input
              v-model="telegramId"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Ваш Telegram ID"
            />
            <p v-if="errors.telegram" class="text-xs text-danger">{{ errors.telegram }}</p>
            <BaseButton :loading="loading" class="w-full" @click="handleTelegramLogin">
              Войти
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
