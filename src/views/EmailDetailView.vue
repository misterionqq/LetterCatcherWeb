<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotificationsStore } from '@/stores/notifications.js'
import DOMPurify from 'dompurify'

const route = useRoute()
const router = useRouter()
const store = useNotificationsStore()

const uid = computed(() => route.params.uid)
const email = computed(() => store.getEmailByUid(uid.value))
const isFull = computed(() => store.isFullEmail(uid.value))
const viewMode = ref('html') // 'html' | 'text'

const safeHtml = computed(() => {
  if (!email.value?.body_html) return ''
  return DOMPurify.sanitize(email.value.body_html)
})

const hasHtml = computed(() => !!email.value?.body_html)
const hasText = computed(() => !!email.value?.body_full)

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function shortenUrl(url) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function fileIcon(contentType) {
  if (!contentType) return '\u{1F4C4}'
  if (contentType.startsWith('image/')) return '\u{1F5BC}'
  if (contentType.includes('pdf')) return '\u{1F4C4}'
  if (contentType.includes('zip') || contentType.includes('archive') || contentType.includes('rar'))
    return '\u{1F4E6}'
  return '\u{1F4C4}'
}
</script>

<template>
  <div class="px-4 py-4">
    <!-- Back button -->
    <button
      class="mb-4 flex items-center gap-1 text-sm text-primary"
      @click="router.back()"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Назад
    </button>

    <div v-if="email">
      <!-- Header -->
      <div class="mb-4">
        <div class="mb-2 flex items-start gap-2">
          <h1 class="flex-1 text-lg font-bold text-gray-900">{{ email.subject }}</h1>
          <span
            class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
            :class="email.is_important ? 'bg-warning/20 text-amber-700' : 'bg-gray-100 text-gray-500'"
          >
            {{ email.is_important ? 'Важное' : 'Обычное' }}
          </span>
        </div>
      </div>

      <!-- Metadata -->
      <div class="mb-4 space-y-1.5 rounded-xl bg-white p-4 shadow-sm text-sm">
        <p><span class="text-gray-400">От: </span><span class="text-gray-700">{{ email.sender }}</span></p>
        <p><span class="text-gray-400">Дата: </span><span class="text-gray-700">{{ formatDate(email.date || email.processed_at) }}</span></p>
        <p v-if="email.ai_reason"><span class="text-gray-400">AI: </span><span class="italic text-primary">{{ email.ai_reason }}</span></p>
        <p v-if="email.triggered_word">
          <span class="text-gray-400">Триггер: </span>
          <span class="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">{{ email.triggered_word }}</span>
        </p>
      </div>

      <!-- Body -->
      <div v-if="isFull" class="mb-4">
        <!-- View mode toggle -->
        <div v-if="hasHtml && hasText" class="mb-2 flex rounded-lg bg-gray-100 p-1">
          <button
            class="flex-1 rounded-md py-1.5 text-xs font-medium transition-colors"
            :class="viewMode === 'html' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'"
            @click="viewMode = 'html'"
          >
            HTML
          </button>
          <button
            class="flex-1 rounded-md py-1.5 text-xs font-medium transition-colors"
            :class="viewMode === 'text' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'"
            @click="viewMode = 'text'"
          >
            Текст
          </button>
        </div>

        <div class="rounded-xl bg-white p-4 shadow-sm">
          <div
            v-if="(viewMode === 'html' && hasHtml) || (!hasText && hasHtml)"
            class="prose prose-sm max-w-none break-words"
            v-html="safeHtml"
          />
          <div
            v-else-if="hasText"
            class="whitespace-pre-wrap text-sm text-gray-700"
          >{{ email.body_full }}</div>
          <p v-else class="text-sm text-gray-400">Текст письма отсутствует</p>
        </div>
      </div>

      <!-- No full data placeholder -->
      <div v-else class="mb-4 rounded-xl bg-gray-50 p-4 text-center">
        <p class="text-sm text-gray-400">
          Полный текст недоступен (письмо получено до подключения)
        </p>
      </div>

      <!-- Links -->
      <div v-if="email.links?.length" class="mb-4">
        <h2 class="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">Ссылки из письма</h2>
        <div class="space-y-1.5">
          <a
            v-for="(link, i) in email.links"
            :key="i"
            :href="link"
            target="_blank"
            rel="noopener"
            class="block truncate rounded-lg bg-white px-3 py-2.5 text-sm text-primary shadow-sm hover:bg-blue-50"
          >&#x1F517; {{ shortenUrl(link) }}</a>
        </div>
      </div>

      <!-- Attachments -->
      <div v-if="email.attachments?.length" class="mb-4">
        <h2 class="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">Вложения</h2>
        <div class="space-y-1.5">
          <div
            v-for="(att, i) in email.attachments"
            :key="i"
            class="flex items-center justify-between rounded-lg bg-white px-3 py-2.5 shadow-sm"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span>{{ fileIcon(att.content_type) }}</span>
              <span class="truncate text-sm text-gray-700">{{ att.name }}</span>
              <span class="shrink-0 text-xs text-gray-400">{{ formatSize(att.size) }}</span>
            </div>
            <button
              disabled
              class="shrink-0 text-xs text-gray-300"
              title="Скачивание недоступно"
            >
              Скачать
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Email not found -->
    <div v-else class="mt-12 text-center">
      <p class="text-sm text-gray-400">Письмо не найдено</p>
      <button
        class="mt-3 text-sm font-medium text-primary hover:underline"
        @click="router.push('/')"
      >
        На главную
      </button>
    </div>
  </div>
</template>
