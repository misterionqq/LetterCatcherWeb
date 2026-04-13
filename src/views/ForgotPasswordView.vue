<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { useToast } from '@/composables/useToast.js'
import { isServerConfigured } from '@/utils/serverUrl.js'
import BaseButton from '@/components/BaseButton.vue'

const authStore = useAuthStore()
const { addToast } = useToast()

const email = ref('')
const loading = ref(false)
const sent = ref(false)
const error = ref('')

async function handleSubmit() {
  if (!isServerConfigured()) return
  if (!email.value.trim()) {
    error.value = 'Введите email'
    return
  }
  if (!/\S+@\S+\.\S+/.test(email.value)) {
    error.value = 'Некорректный email'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await authStore.forgotPassword(email.value)
    sent.value = true
  } catch (e) {
    if (e.rateLimited) {
      error.value = 'Слишком много попыток. Подождите минуту.'
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

      <div class="rounded-2xl bg-white p-6 shadow-sm">
        <template v-if="!sent">
          <h2 class="mb-2 text-lg font-semibold text-gray-900">Сброс пароля</h2>
          <p class="mb-4 text-sm text-gray-500">
            Введите email, и мы отправим ссылку для сброса пароля.
          </p>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <input
                v-model="email"
                type="email"
                class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="user@company.com"
              />
              <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
            </div>

            <BaseButton type="submit" :loading="loading" class="w-full">
              Отправить ссылку
            </BaseButton>
          </form>
        </template>

        <template v-else>
          <div class="text-center">
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 class="mb-2 text-lg font-semibold text-gray-900">Проверьте почту</h2>
            <p class="text-sm text-gray-500">
              Если этот email зарегистрирован, мы отправили ссылку для сброса пароля.
            </p>
          </div>
        </template>

        <router-link
          to="/login"
          class="mt-4 block text-center text-sm text-primary hover:underline"
        >
          Вернуться к входу
        </router-link>
      </div>
    </div>
  </div>
</template>
