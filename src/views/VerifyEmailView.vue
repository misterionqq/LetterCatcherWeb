<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import * as authApi from '@/api/auth.js'

const route = useRoute()

const loading = ref(true)
const success = ref(false)
const message = ref('')
const error = ref('')

onMounted(async () => {
  const token = route.query.token
  if (!token) {
    loading.value = false
    error.value = 'Отсутствует токен верификации'
    return
  }

  try {
    const isEmailChange = route.path === '/verify-email-change'
    const result = isEmailChange
      ? await authApi.verifyEmailChange(token)
      : await authApi.verifyEmail(token)
    success.value = true
    message.value = result.message || (isEmailChange ? 'Email успешно изменён!' : 'Email подтверждён!')
  } catch (e) {
    if (e.response?.status === 400) {
      error.value = 'Ссылка устарела или недействительна'
    } else {
      error.value = 'Произошла ошибка. Попробуйте позже.'
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md">
      <h1 class="mb-8 text-center text-2xl font-bold text-gray-900">LetterCatcher</h1>

      <div class="rounded-2xl bg-white p-6 shadow-sm text-center">
        <!-- Loading -->
        <template v-if="loading">
          <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
            <svg class="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p class="text-sm text-gray-500">Проверяем...</p>
        </template>

        <!-- Success -->
        <template v-else-if="success">
          <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="mb-2 text-lg font-semibold text-gray-900">{{ message }}</h2>
          <p class="text-sm text-gray-500">Можете вернуться в приложение.</p>
        </template>

        <!-- Error -->
        <template v-else>
          <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg class="h-6 w-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 class="mb-2 text-lg font-semibold text-gray-900">Ошибка</h2>
          <p class="text-sm text-gray-500">{{ error }}</p>
        </template>

        <router-link
          to="/login"
          class="mt-6 inline-block text-sm text-primary hover:underline"
        >
          Перейти к входу
        </router-link>
      </div>
    </div>
  </div>
</template>
