<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { useAuthStore } from '@/stores/auth.js'
import { useToast } from '@/composables/useToast.js'
import { getServerUrl, setServerUrl, isServerConfigured } from '@/utils/serverUrl.js'
import { getServerInfo } from '@/api/settings.js'
import BaseButton from '@/components/BaseButton.vue'
import BaseModal from '@/components/BaseModal.vue'

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
const loading = ref(false)
const errors = ref({})

// Post-registration state
const showVerificationBanner = ref(false)
const verificationEmail = ref('')

// Telegram guide
const botUsername = ref('')
const showTelegramGuide = ref(false)

// Privacy consent
const consentAccepted = ref(false)
const showPrivacyPolicy = ref(false)

onMounted(() => {
  const current = getServerUrl()
  if (current) {
    serverInput.value = current.replace(/\/api\/v1$/, '')
    serverSaved.value = true
  }
  if (isNative && !isServerConfigured()) {
    showServerConfig.value = true
  }
  if (authStore.justRegistered) {
    showVerificationBanner.value = true
    verificationEmail.value = authStore.registeredEmail
    authStore.justRegistered = false
  }
  if (isServerConfigured()) {
    fetchBotUsername()
  }
})

async function fetchBotUsername() {
  try {
    const info = await getServerInfo()
    if (info.bot_username) {
      botUsername.value = info.bot_username
    }
  } catch {
    // Server info unavailable
  }
}

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
  fetchBotUsername()
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
      router.push('/')
    } else {
      await authStore.register(email.value, password.value)
      showVerificationBanner.value = true
      verificationEmail.value = email.value
      router.push('/')
    }
  } catch (e) {
    if (e.rateLimited) {
      errors.value.general = 'Слишком много попыток. Подождите минуту.'
    } else {
      const status = e.response?.status
      if (status === 401) {
        errors.value.general = 'Неверный email или пароль'
      } else if (status === 409) {
        errors.value.email = 'Этот email уже зарегистрирован. Если вы регистрировались через Telegram-бота, нажмите «Войти через Telegram» на странице входа.'
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

      <!-- Email verification banner (after registration) -->
      <div
        v-if="showVerificationBanner"
        class="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4"
      >
        <div class="flex gap-3">
          <svg class="h-5 w-5 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div>
            <p class="text-sm font-medium text-blue-900">Подтвердите email</p>
            <p class="mt-1 text-xs text-blue-700">
              Мы отправили письмо на <strong>{{ verificationEmail }}</strong>.
              Перейдите по ссылке для подтверждения.
            </p>
          </div>
        </div>
      </div>

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

          <!-- Privacy consent checkbox -->
          <div class="flex items-start gap-2">
            <input
              id="consent"
              v-model="consentAccepted"
              type="checkbox"
              class="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label for="consent" class="text-xs leading-relaxed text-gray-600">
              Я даю
              <button
                type="button"
                class="text-primary hover:underline"
                @click="showPrivacyPolicy = true"
              >согласие на обработку персональных данных</button>
            </label>
          </div>

          <BaseButton type="submit" :loading="loading" :disabled="!consentAccepted" class="w-full">
            {{ activeTab === 'login' ? 'Войти' : 'Зарегистрироваться' }}
          </BaseButton>
        </form>

        <!-- Forgot password -->
        <div v-if="activeTab === 'login'" class="mt-3 text-center">
          <router-link
            to="/forgot-password"
            class="text-sm text-primary hover:underline"
          >
            Забыли пароль?
          </router-link>
        </div>

        <!-- Telegram guide link -->
        <div class="mt-6 border-t border-gray-100 pt-4">
          <p class="mb-3 text-center text-xs text-gray-400">или</p>
          <button
            class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            @click="showTelegramGuide = true"
          >
            <svg class="h-5 w-5 text-[#2AABEE]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Войти через Telegram
          </button>
        </div>
      </div>
    </div>

    <!-- Privacy policy modal -->
    <BaseModal v-if="showPrivacyPolicy" title="Согласие на обработку персональных данных" @close="showPrivacyPolicy = false">
      <div class="max-h-[60vh] overflow-y-auto pr-3 space-y-3 text-sm text-gray-700">
        <p>
          Настоящим я, субъект персональных данных, в соответствии с Федеральным законом
          от 27.07.2006 № 152-ФЗ «О персональных данных», свободно, своей волей и в своём
          интересе даю согласие оператору сервиса <strong>LetterCatcher</strong> на обработку
          моих персональных данных на следующих условиях:
        </p>

        <h4 class="font-semibold text-gray-900">1. Перечень персональных данных</h4>
        <ul class="list-disc pl-5 space-y-1">
          <li>Адрес электронной почты (email)</li>
          <li>Хешированный пароль учётной записи</li>
          <li>Идентификатор Telegram (при привязке аккаунта)</li>
          <li>Содержимое входящей электронной корреспонденции, обрабатываемой сервисом</li>
        </ul>

        <h4 class="font-semibold text-gray-900">2. Цели обработки</h4>
        <ul class="list-disc pl-5 space-y-1">
          <li>Регистрация и аутентификация пользователя в сервисе</li>
          <li>Приём, хранение и отображение входящей электронной почты</li>
          <li>Доставка уведомлений о новых письмах через Telegram</li>
          <li>Обеспечение безопасности учётной записи (восстановление пароля, подтверждение email)</li>
        </ul>

        <h4 class="font-semibold text-gray-900">3. Способы обработки</h4>
        <p>
          Сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение),
          извлечение, использование, передача (предоставление, доступ), блокирование, удаление,
          уничтожение — с использованием средств автоматизации и без таковых.
        </p>

        <h4 class="font-semibold text-gray-900">4. Срок обработки</h4>
        <p>
          Персональные данные обрабатываются до момента удаления учётной записи пользователем
          либо до отзыва настоящего согласия. После отзыва согласия данные удаляются
          в течение 30 (тридцати) календарных дней, за исключением случаев, предусмотренных
          законодательством Российской Федерации.
        </p>

        <h4 class="font-semibold text-gray-900">5. Права субъекта</h4>
        <p>
          Вы вправе в любое время отозвать настоящее согласие, направив запрос оператору,
          а также требовать уточнения, блокирования или уничтожения персональных данных
          в соответствии со ст. 14 Федерального закона № 152-ФЗ.
        </p>
      </div>
      <BaseButton class="mt-4 w-full" @click="showPrivacyPolicy = false">
        Закрыть
      </BaseButton>
    </BaseModal>

    <!-- Telegram guide modal -->
    <BaseModal v-if="showTelegramGuide" title="Как войти через Telegram" @close="showTelegramGuide = false">
      <div class="space-y-3">
        <ol class="list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            Откройте бота
            <a
              v-if="botUsername"
              :href="`https://t.me/${botUsername}`"
              target="_blank"
              class="font-medium text-primary hover:underline"
            >@{{ botUsername }}</a>
            <span v-else class="font-medium">в Telegram</span>
          </li>
          <li>Отправьте команду <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">/link</code> и введите ваш email</li>
          <li>Введите код из письма — аккаунты объединятся</li>
          <li>Вернитесь сюда и нажмите «Забыли пароль?»</li>
          <li>На вашу почту придёт ссылка для создания пароля</li>
          <li>После установки пароля вы сможете входить на сайт</li>
        </ol>
        <div class="rounded-lg bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
          После этого уведомления будут приходить и в Telegram, и на сайт.
        </div>
        <BaseButton class="w-full" @click="showTelegramGuide = false">
          Понятно
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
