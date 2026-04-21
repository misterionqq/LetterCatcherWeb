import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/views/LoginView.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/views/ForgotPasswordView.vue', () => ({
  default: { template: '<div />' },
}))
vi.mock('@/views/ResetPasswordView.vue', () => ({
  default: { template: '<div />' },
}))
vi.mock('@/views/VerifyEmailView.vue', () => ({
  default: { template: '<div />' },
}))
vi.mock('@/views/FaqView.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/views/NotificationsView.vue', () => ({
  default: { template: '<div />' },
}))
vi.mock('@/views/EmailDetailView.vue', () => ({
  default: { template: '<div />' },
}))
vi.mock('@/views/SettingsView.vue', () => ({
  default: { template: '<div />' },
}))
vi.mock('@/views/StatsView.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/AuthenticatedLayout.vue', () => ({
  default: { template: '<div><router-view /></div>' },
}))

import router from '@/router/index.js'

describe('router guards', () => {
  beforeEach(async () => {
    localStorage.clear()
    await router.push('/faq')
  })

  it('redirects to /login when accessing protected route without token', async () => {
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('allows access to /login without token', async () => {
    await router.push('/login')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('allows access to /faq without token', async () => {
    await router.push('/faq')
    expect(router.currentRoute.value.path).toBe('/faq')
  })

  it('allows access to /forgot-password without token', async () => {
    await router.push('/forgot-password')
    expect(router.currentRoute.value.path).toBe('/forgot-password')
  })

  it('redirects from /login to / when token exists', async () => {
    localStorage.setItem('access_token', 'test-token')
    await router.push('/login')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('allows access to protected routes with token', async () => {
    localStorage.setItem('access_token', 'test-token')
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('allows access to /settings with token', async () => {
    localStorage.setItem('access_token', 'test-token')
    await router.push('/settings')
    expect(router.currentRoute.value.path).toBe('/settings')
  })

  it('redirects unknown routes to /', async () => {
    localStorage.setItem('access_token', 'test-token')
    await router.push('/nonexistent-page')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('redirects /history to /', async () => {
    localStorage.setItem('access_token', 'test-token')
    await router.push('/history')
    expect(router.currentRoute.value.path).toBe('/')
  })
})
