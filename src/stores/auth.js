import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/api/auth.js'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('access_token'))

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
  }

  async function telegramLogin(telegramId) {
    const data = await authApi.telegramLogin(telegramId)
    setToken(data.access_token)
  }

  function logout() {
    token.value = null
    localStorage.removeItem('access_token')
    router.push('/login')
  }

  return { token, isAuthenticated, login, register, telegramLogin, logout }
})
