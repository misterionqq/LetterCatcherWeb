<script setup>
defineProps({
  word: { type: String, required: true },
  isStopWord: { type: Boolean, default: false },
})

const emit = defineEmits(['remove'])
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm"
    :class="isStopWord ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'"
  >
    {{ word }}
    <button
      class="ml-0.5 rounded-full p-0.5 hover:bg-black/10"
      @click="emit('remove', word)"
    >
      <svg class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
        <path
          fill-rule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  </span>
</template>
