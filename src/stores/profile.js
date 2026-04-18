import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as profileApi from '@/api/profile.js'
import * as keywordsApi from '@/api/keywords.js'
import { getServerInfo } from '@/api/settings.js'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const forwardingEmail = ref('')
  const botUsername = ref('')

  async function fetchProfile() {
    loading.value = true
    error.value = null
    try {
      profile.value = await profileApi.getProfile()
    } catch (e) {
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateEmail(email) {
    const result = await profileApi.updateEmail(email)
    return result
  }

  async function setSensitivity(level) {
    profile.value = await profileApi.setSensitivity(level)
  }

  async function toggleDnd() {
    return await profileApi.toggleDnd()
  }

  async function getPendingDnd() {
    return await profileApi.getPendingDnd()
  }

  async function addKeyword(word) {
    profile.value = await keywordsApi.addKeyword(word)
  }

  async function addStopWord(word) {
    profile.value = await keywordsApi.addStopWord(word)
  }

  async function removeKeyword(word) {
    profile.value = await keywordsApi.removeKeyword(word)
  }

  async function linkTelegram() {
    return await profileApi.linkTelegram()
  }

  async function fetchServerInfo() {
    try {
      const info = await getServerInfo()
      if (info.forwarding_email) forwardingEmail.value = info.forwarding_email
      if (info.bot_username) botUsername.value = info.bot_username
    } catch {
      // Server info unavailable
    }
  }

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateEmail,
    setSensitivity,
    toggleDnd,
    getPendingDnd,
    addKeyword,
    addStopWord,
    removeKeyword,
    linkTelegram,
    forwardingEmail,
    botUsername,
    fetchServerInfo,
  }
})
