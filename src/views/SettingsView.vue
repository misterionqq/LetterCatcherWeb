<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProfileStore } from '@/stores/profile.js'
import { useAuthStore } from '@/stores/auth.js'
import { useToast } from '@/composables/useToast.js'
import BaseButton from '@/components/BaseButton.vue'
import BaseModal from '@/components/BaseModal.vue'
import KeywordChip from '@/components/KeywordChip.vue'

const profileStore = useProfileStore()
const authStore = useAuthStore()
const { addToast } = useToast()

// Email modal
const showEmailModal = ref(false)
const newEmail = ref('')
const emailLoading = ref(false)
const emailError = ref('')

// Keywords
const newKeyword = ref('')
const newStopWord = ref('')
const keywordLoading = ref(false)
const stopWordLoading = ref(false)
const keywordError = ref('')
const stopWordError = ref('')

// Resend verification
const resendLoading = ref(false)

// DND
const dndLoading = ref(false)
const showPendingModal = ref(false)
const pendingNotifications = ref([])

// Telegram
const telegramLinkLoading = ref(false)
const showTelegramHint = ref(false)

// Sensitivity
const sensitivityLoading = ref(false)

const triggerWords = computed(() =>
  (profileStore.profile?.keywords || []).filter((k) => !k.is_stop_word)
)

const stopWords = computed(() =>
  (profileStore.profile?.keywords || []).filter((k) => k.is_stop_word)
)

const sensitivityLabels = {
  low: 'Без ИИ',
  medium: 'По ключевым словам',
  high: 'ИИ для всего',
}

onMounted(() => {
  if (!profileStore.profile && !profileStore.loading) {
    profileStore.fetchProfile().catch(() => {})
  }
  if (!profileStore.botUsername && !profileStore.forwardingEmail) {
    profileStore.fetchServerInfo()
  }
})

async function handleResendVerification() {
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

async function handleLinkTelegram() {
  telegramLinkLoading.value = true
  try {
    const result = await profileStore.linkTelegram()
    window.open(result.link, '_blank')
    showTelegramHint.value = true
  } catch (e) {
    if (e.response?.status === 409) {
      addToast('Telegram уже привязан', 'info')
      await profileStore.fetchProfile()
    } else if (e.response?.status === 503) {
      addToast('Telegram-бот не настроен на сервере', 'error')
    } else {
      addToast('Ошибка при привязке', 'error')
    }
  } finally {
    telegramLinkLoading.value = false
  }
}

function handleRefreshTelegramStatus() {
  profileStore.fetchProfile().catch(() => {})
  showTelegramHint.value = false
}

async function handleUpdateEmail() {
  if (!newEmail.value.trim()) {
    emailError.value = 'Введите email'
    return
  }
  emailLoading.value = true
  emailError.value = ''
  try {
    const result = await profileStore.updateEmail(newEmail.value)
    showEmailModal.value = false
    newEmail.value = ''
    addToast(result.message || 'Письмо с подтверждением отправлено на новый адрес', 'success')
  } catch (e) {
    if (e.rateLimited) {
      emailError.value = 'Слишком много попыток. Подождите минуту.'
    } else if (e.response?.status === 409) {
      emailError.value = 'Этот email уже используется'
    } else if (e.response?.status === 422) {
      emailError.value = 'Некорректный email'
    } else {
      addToast('Ошибка при обновлении', 'error')
    }
  } finally {
    emailLoading.value = false
  }
}

async function handleSensitivity(level) {
  sensitivityLoading.value = true
  try {
    await profileStore.setSensitivity(level)
    addToast('Чувствительность обновлена', 'success')
  } catch {
    addToast('Ошибка при обновлении', 'error')
  } finally {
    sensitivityLoading.value = false
  }
}

async function handleToggleDnd() {
  dndLoading.value = true
  try {
    const result = await profileStore.toggleDnd()
    // Update local profile DND state
    if (profileStore.profile) {
      profileStore.profile.is_dnd = result.is_dnd
    }
    if (!result.is_dnd && result.pending_count > 0) {
      pendingNotifications.value = await profileStore.getPendingDnd()
      showPendingModal.value = true
    }
  } catch {
    addToast('Ошибка при переключении DND', 'error')
  } finally {
    dndLoading.value = false
  }
}

async function handleAddKeyword() {
  if (!newKeyword.value.trim()) return
  keywordLoading.value = true
  keywordError.value = ''
  try {
    await profileStore.addKeyword(newKeyword.value.trim())
    newKeyword.value = ''
  } catch (e) {
    if (e.response?.status === 409) {
      keywordError.value = 'Слово уже добавлено'
    } else {
      addToast('Ошибка при добавлении', 'error')
    }
  } finally {
    keywordLoading.value = false
  }
}

async function handleAddStopWord() {
  if (!newStopWord.value.trim()) return
  stopWordLoading.value = true
  stopWordError.value = ''
  try {
    await profileStore.addStopWord(newStopWord.value.trim())
    newStopWord.value = ''
  } catch (e) {
    if (e.response?.status === 409) {
      stopWordError.value = 'Слово уже добавлено'
    } else {
      addToast('Ошибка при добавлении', 'error')
    }
  } finally {
    stopWordLoading.value = false
  }
}

async function copyForwardingEmail() {
  try {
    await navigator.clipboard.writeText(profileStore.forwardingEmail)
    addToast('Скопировано', 'success')
  } catch {
    addToast('Не удалось скопировать', 'error')
  }
}

async function handleRemoveKeyword(word) {
  try {
    await profileStore.removeKeyword(word)
  } catch {
    addToast('Ошибка при удалении', 'error')
  }
}
</script>

<template>
  <div class="px-4 py-4">
    <h1 class="mb-4 text-xl font-bold text-gray-900">Настройки</h1>

    <div v-if="profileStore.profile" class="space-y-6">
      <!-- Profile -->
      <section class="rounded-xl bg-white p-4 shadow-sm">
        <h2 class="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">Профиль</h2>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">{{ profileStore.profile.email || 'Не указан' }}</span>
          <button
            class="text-sm font-medium text-primary hover:underline"
            @click="showEmailModal = true; newEmail = profileStore.profile.email || ''"
          >
            Изменить
          </button>
        </div>
        <div
          v-if="profileStore.profile.email_verified === false"
          class="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
        >
          <svg class="mt-0.5 h-4 w-4 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p class="text-xs text-amber-800">
              Email не подтверждён. Проверьте почту и перейдите по ссылке.
              Уведомления о письмах не будут приходить до подтверждения.
            </p>
            <button
              class="mt-1.5 text-xs font-medium text-amber-700 underline hover:text-amber-900 disabled:opacity-50"
              :disabled="resendLoading"
              @click="handleResendVerification"
            >
              {{ resendLoading ? 'Отправляем...' : 'Отправить повторно' }}
            </button>
          </div>
        </div>
      </section>

      <!-- Forwarding Email -->
      <section v-if="profileStore.forwardingEmail" class="rounded-xl bg-white p-4 shadow-sm">
        <h2 class="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">Адрес для пересылки</h2>
        <p class="mb-2 text-xs text-gray-500">Настройте пересылку входящих писем на этот адрес</p>
        <div class="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-3">
          <code class="flex-1 break-all text-sm font-medium text-gray-900">{{ profileStore.forwardingEmail }}</code>
          <button
            class="shrink-0 rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
            title="Скопировать"
            @click="copyForwardingEmail"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </section>

      <!-- Telegram -->
      <section class="rounded-xl bg-white p-4 shadow-sm">
        <h2 class="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">Telegram</h2>
        <div v-if="profileStore.profile.telegram_id" class="flex items-center gap-2 text-sm text-gray-700">
          <svg class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Привязан
        </div>
        <div v-else>
          <button
            class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
            :disabled="telegramLinkLoading"
            @click="handleLinkTelegram"
          >
            <svg class="h-5 w-5 text-[#2AABEE]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            {{ telegramLinkLoading ? 'Загрузка...' : 'Привязать Telegram' }}
          </button>
          <div
            v-if="showTelegramHint"
            class="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5"
          >
            <p class="text-xs text-blue-700">
              Перейдите в Telegram и нажмите Start. Ссылка действительна 10 минут.
            </p>
            <button
              class="mt-1.5 text-xs font-medium text-blue-600 underline hover:text-blue-800"
              @click="handleRefreshTelegramStatus"
            >
              Я привязал, обновить статус
            </button>
          </div>
        </div>
      </section>

      <!-- AI Sensitivity -->
      <section class="rounded-xl bg-white p-4 shadow-sm">
        <h2 class="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">Чувствительность AI</h2>
        <div class="flex rounded-lg bg-gray-100 p-1">
          <button
            v-for="level in ['low', 'medium', 'high']"
            :key="level"
            class="flex-1 rounded-md py-2 text-xs font-medium transition-colors"
            :class="profileStore.profile.ai_sensitivity === level ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'"
            :disabled="sensitivityLoading"
            @click="handleSensitivity(level)"
          >
            {{ sensitivityLabels[level] }}
          </button>
        </div>
      </section>

      <!-- DND -->
      <section class="rounded-xl bg-white p-4 shadow-sm">
        <h2 class="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">Не беспокоить</h2>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">
            {{ profileStore.profile.is_dnd ? 'Включено' : 'Выключено' }}
          </span>
          <button
            :disabled="dndLoading"
            class="relative h-6 w-11 rounded-full transition-colors"
            :class="profileStore.profile.is_dnd ? 'bg-primary' : 'bg-gray-300'"
            @click="handleToggleDnd"
          >
            <span
              class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
              :class="profileStore.profile.is_dnd ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>
      </section>

      <!-- Trigger Keywords -->
      <section class="rounded-xl bg-white p-4 shadow-sm">
        <h2 class="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">Триггерные слова</h2>
        <div v-if="triggerWords.length" class="mb-3 flex flex-wrap gap-2">
          <KeywordChip
            v-for="kw in triggerWords"
            :key="kw.word"
            :word="kw.word"
            @remove="handleRemoveKeyword"
          />
        </div>
        <p v-else class="mb-3 text-xs text-gray-400">Нет триггерных слов</p>
        <div class="flex gap-2">
          <input
            v-model="newKeyword"
            type="text"
            class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Новое слово"
            @keyup.enter="handleAddKeyword"
          />
          <BaseButton :loading="keywordLoading" @click="handleAddKeyword">
            Добавить
          </BaseButton>
        </div>
        <p v-if="keywordError" class="mt-1 text-xs text-danger">{{ keywordError }}</p>
      </section>

      <!-- Stop Words -->
      <section class="rounded-xl bg-white p-4 shadow-sm">
        <h2 class="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">Стоп-слова</h2>
        <div v-if="stopWords.length" class="mb-3 flex flex-wrap gap-2">
          <KeywordChip
            v-for="kw in stopWords"
            :key="kw.word"
            :word="kw.word"
            :is-stop-word="true"
            @remove="handleRemoveKeyword"
          />
        </div>
        <p v-else class="mb-3 text-xs text-gray-400">Нет стоп-слов</p>
        <div class="flex gap-2">
          <input
            v-model="newStopWord"
            type="text"
            class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Новое стоп-слово"
            @keyup.enter="handleAddStopWord"
          />
          <BaseButton :loading="stopWordLoading" @click="handleAddStopWord">
            Добавить
          </BaseButton>
        </div>
        <p v-if="stopWordError" class="mt-1 text-xs text-danger">{{ stopWordError }}</p>
      </section>

      <!-- Logout -->
      <BaseButton variant="danger" class="w-full" @click="authStore.logout()">
        Выйти
      </BaseButton>
    </div>

    <!-- Loading state -->
    <div v-else-if="profileStore.loading" class="space-y-4">
      <div v-for="i in 4" :key="i" class="animate-pulse rounded-xl bg-white p-4 shadow-sm">
        <div class="mb-3 h-3 w-24 rounded bg-gray-200" />
        <div class="h-5 w-48 rounded bg-gray-200" />
      </div>
    </div>

    <!-- Error state -->
    <div v-else class="mt-12 text-center">
      <p class="text-sm text-gray-400">Не удалось загрузить профиль</p>
      <button
        class="mt-3 text-sm font-medium text-primary hover:underline"
        @click="profileStore.fetchProfile().catch(() => {})"
      >
        Попробовать снова
      </button>
    </div>

    <!-- Email modal -->
    <BaseModal v-if="showEmailModal" title="Изменить email" @close="showEmailModal = false">
      <form @submit.prevent="handleUpdateEmail" class="space-y-4">
        <input
          v-model="newEmail"
          type="email"
          class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="Новый email"
        />
        <p v-if="emailError" class="text-xs text-danger">{{ emailError }}</p>
        <BaseButton type="submit" :loading="emailLoading" class="w-full">
          Сохранить
        </BaseButton>
      </form>
    </BaseModal>

    <!-- Pending DND modal -->
    <BaseModal v-if="showPendingModal" title="Пропущенные уведомления" @close="showPendingModal = false">
      <div class="max-h-64 space-y-2 overflow-y-auto">
        <div
          v-for="(n, i) in pendingNotifications"
          :key="i"
          class="rounded-lg bg-gray-50 p-3"
        >
          <p class="text-sm font-medium text-gray-900">{{ n.subject }}</p>
          <p class="text-xs text-gray-500">{{ n.sender }}</p>
        </div>
        <p v-if="!pendingNotifications.length" class="text-sm text-gray-400">Нет пропущенных</p>
      </div>
    </BaseModal>
  </div>
</template>
