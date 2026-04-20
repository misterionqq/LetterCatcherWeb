import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/api/auth.js'
import { usePushNotifications } from '@/composables/usePushNotifications.js'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('access_token'))
  const justRegistered = ref(false)
  const registeredEmail = ref('')

  const isAuthenticated = computed(() => !!token.value)

  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('access_token', newToken)
  }

  async function login(email, password) {
    const data = await authApi.login(email, password)
    setToken(data.access_token)
  }

  async function register(email, password) {
    const data = await authApi.register(email, password)
    setToken(data.access_token)
    justRegistered.value = true
    registeredEmail.value = email
  }

  async function telegramLogin(widgetData) {
    const data = await authApi.telegramLogin(widgetData)
    setToken(data.access_token)
  }

  async function forgotPassword(email) {
    return await authApi.forgotPassword(email)
  }

  async function resetPassword(resetToken, newPassword) {
    return await authApi.resetPassword(resetToken, newPassword)
  }

  async function resendVerification() {
    return await authApi.resendVerification()
  }

  async function logout() {
    const { unregister } = usePushNotifications()
    await unregister()
    token.value = null
    justRegistered.value = false
    registeredEmail.value = ''
    localStorage.removeItem('access_token')
    router.push('/login')
  }

  return {
    token,
    isAuthenticated,
    justRegistered,
    registeredEmail,
    login,
    register,
    telegramLogin,
    forgotPassword,
    resetPassword,
    resendVerification,
    logout,
  }
})
