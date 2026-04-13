<script setup>
defineProps({
  email: { type: Object, required: true },
})

const emit = defineEmits(['click'])

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div
    class="flex cursor-pointer items-start gap-3 rounded-xl bg-white p-4 shadow-sm transition-colors active:bg-gray-50"
    @click="emit('click', email)"
  >
    <!-- Color indicator -->
    <div
      class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
      :class="email.is_important ? 'bg-warning' : 'bg-gray-300'"
    />

    <!-- Content -->
    <div class="min-w-0 flex-1">
      <div class="mb-0.5 flex items-start justify-between gap-2">
        <h3 class="truncate text-sm font-semibold text-gray-900">
          {{ email.subject }}
        </h3>
        <span class="shrink-0 text-xs text-gray-400">
          {{ formatDate(email.date || email.processed_at) }}
        </span>
      </div>

      <p class="mb-1 text-xs text-gray-500">{{ email.sender }}</p>

      <div v-if="email.is_important" class="flex flex-wrap items-center gap-1.5">
        <span class="inline-block rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-amber-700">
          Важное
        </span>
        <span v-if="email.triggered_word" class="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
          {{ email.triggered_word }}
        </span>
      </div>

      <p v-if="email.is_important && email.ai_reason" class="mt-1 truncate text-xs text-primary">
        {{ email.ai_reason }}
      </p>
    </div>

    <!-- Arrow -->
    <svg class="mt-1.5 h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  </div>
</template>
