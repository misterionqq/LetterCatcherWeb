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

// DND
const dndLoading = ref(false)
const showPendingModal = ref(false)
const pendingNotifications = ref([])

// Sensitivity
const sensitivityLoading = ref(false)

const triggerWords = computed(() =>
  (profileStore.profile?.keywords || []).filter((k) => !k.is_stop_word)
)

const stopWords = computed(() =>
  (profileStore.profile?.keywords || []).filter((k) => k.is_stop_word)
)

const sensitivityLabels = {
  low: 'Только суперважные',
  medium: 'Сбалансированный',
  high: 'Все подряд',
}

onMounted(() => {
  if (!profileStore.profile && !profileStore.loading) {
    profileStore.fetchProfile().catch(() => {})
  }
})

async function handleUpdateEmail() {
  if (!newEmail.value.trim()) {
    emailError.value = 'Введите email'
    return
  }
  emailLoading.value = true
  emailError.value = ''
  try {
    await profileStore.updateEmail(newEmail.value)
    showEmailModal.value = false
    newEmail.value = ''
    addToast('Email обновлён', 'success')
  } catch (e) {
    if (e.response?.status === 422) {
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
