import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/auth.js', () => ({
  login: vi.fn(),
  register: vi.fn(),
  telegramLogin: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  resendVerification: vi.fn(),
}))

vi.mock('@/composables/usePushNotifications.js', () => ({
  usePushNotifications: () => ({
    register: vi.fn(),
    unregister: vi.fn(),
  }),
}))

vi.mock('@/router', () => ({
  default: { push: vi.fn() },
}))

import { useAuthStore } from '@/stores/auth.js'
import * as authApi from '@/api/auth.js'
import router from '@/router'

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('starts unauthenticated when no token in localStorage', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.token).toBeNull()
  })

  it('starts authenticated when token exists in localStorage', () => {
    localStorage.setItem('access_token', 'existing-token')
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(true)
    expect(store.token).toBe('existing-token')
  })

  describe('login', () => {
    it('saves token on success', async () => {
      authApi.login.mockResolvedValue({ access_token: 'new-token' })
      const store = useAuthStore()

      await store.login('user@test.com', 'password')

      expect(store.token).toBe('new-token')
      expect(store.isAuthenticated).toBe(true)
      expect(localStorage.getItem('access_token')).toBe('new-token')
    })

    it('propagates API errors', async () => {
      authApi.login.mockRejectedValue(new Error('Invalid credentials'))
      const store = useAuthStore()

      await expect(store.login('bad@test.com', 'wrong')).rejects.toThrow(
        'Invalid credentials',
      )
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('register', () => {
    it('saves token and sets justRegistered flag', async () => {
      authApi.register.mockResolvedValue({ access_token: 'reg-token' })
      const store = useAuthStore()

      await store.register('new@test.com', 'password')

      expect(store.token).toBe('reg-token')
      expect(store.isAuthenticated).toBe(true)
      expect(store.justRegistered).toBe(true)
      expect(store.registeredEmail).toBe('new@test.com')
    })
  })

  describe('telegramLogin', () => {
    it('saves token from widget data', async () => {
      authApi.telegramLogin.mockResolvedValue({ access_token: 'tg-token' })
      const store = useAuthStore()

      await store.telegramLogin({ id: 123 })

      expect(store.token).toBe('tg-token')
      expect(store.isAuthenticated).toBe(true)
    })
  })

  describe('logout', () => {
    it('clears state and redirects to /login', async () => {
      localStorage.setItem('access_token', 'token')
      const store = useAuthStore()

      await store.logout()

      expect(store.token).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.justRegistered).toBe(false)
      expect(store.registeredEmail).toBe('')
      expect(localStorage.getItem('access_token')).toBeNull()
      expect(router.push).toHaveBeenCalledWith('/login')
    })
  })

  describe('forgotPassword', () => {
    it('delegates to API', async () => {
      authApi.forgotPassword.mockResolvedValue({ message: 'sent' })
      const store = useAuthStore()

      const result = await store.forgotPassword('user@test.com')

      expect(authApi.forgotPassword).toHaveBeenCalledWith('user@test.com')
      expect(result).toEqual({ message: 'sent' })
    })
  })

  describe('resetPassword', () => {
    it('delegates to API', async () => {
      authApi.resetPassword.mockResolvedValue({ message: 'ok' })
      const store = useAuthStore()

      const result = await store.resetPassword('reset-tok', 'newpass')

      expect(authApi.resetPassword).toHaveBeenCalledWith('reset-tok', 'newpass')
      expect(result).toEqual({ message: 'ok' })
    })
  })
})
