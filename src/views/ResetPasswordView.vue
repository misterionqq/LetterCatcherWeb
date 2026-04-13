<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useToast } from '@/composables/useToast.js'
import BaseButton from '@/components/BaseButton.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { addToast } = useToast()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errors = ref({})
const success = ref(false)

const token = route.query.token

function validate() {
  errors.value = {}
  if (!password.value) {
    errors.value.password = 'Введите пароль'
  } else if (password.value.length < 8) {
    errors.value.password = 'Минимум 8 символов'
  }
  if (password.value !== confirmPassword.value) {
    errors.value.confirm = 'Пароли не совпадают'
  }
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  if (!token) {
    errors.value.general = 'Отсутствует токен сброса'
    return
  }
  loading.value = true
  errors.value = {}
  try {
    await authStore.resetPassword(token, password.value)
    success.value = true
    setTimeout(() => router.push('/login'), 3000)
  } catch (e) {
    if (e.rateLimited) {
      errors.value.general = 'Слишком много попыток. Подождите минуту.'
    } else if (e.response?.status === 400) {
      errors.value.general = 'Ссылка устарела или недействительна'
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
        <template v-if="success">
          <div class="text-center">
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="mb-2 text-lg font-semibold text-gray-900">Пароль изменён</h2>
            <p class="text-sm text-gray-500">Перенаправляем на страницу входа...</p>
          </div>
        </template>

        <template v-else-if="!token">
          <div class="text-center">
            <p class="text-sm text-danger">Некорректная ссылка сброса пароля.</p>
            <router-link
              to="/login"
              class="mt-4 block text-sm text-primary hover:underline"
            >
              Вернуться к входу
            </router-link>
          </div>
        </template>

        <template v-else>
          <h2 class="mb-4 text-lg font-semibold text-gray-900">Новый пароль</h2>

          <form @submit.prevent="handleSubmit" class="space-y-4">
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

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">Подтвердите пароль</label>
              <input
                v-model="confirmPassword"
                type="password"
                class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Повторите пароль"
              />
              <p v-if="errors.confirm" class="mt-1 text-xs text-danger">{{ errors.confirm }}</p>
            </div>

            <p v-if="errors.general" class="text-sm text-danger">{{ errors.general }}</p>

            <BaseButton type="submit" :loading="loading" class="w-full">
              Сохранить пароль
            </BaseButton>
          </form>
        </template>

        <router-link
          v-if="!success"
          to="/login"
          class="mt-4 block text-center text-sm text-primary hover:underline"
        >
          Вернуться к входу
        </router-link>
      </div>
    </div>
  </div>
</template>
