import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockIsNativePlatform } = vi.hoisted(() => ({
  mockIsNativePlatform: vi.fn(() => false),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: mockIsNativePlatform,
  },
}))

import {
  getServerUrl,
  setServerUrl,
  isServerConfigured,
  clearServerUrl,
} from '@/utils/serverUrl.js'

describe('serverUrl', () => {
  beforeEach(() => {
    localStorage.clear()
    mockIsNativePlatform.mockReturnValue(false)
  })

  describe('setServerUrl', () => {
    it('appends /api/v1 to a bare origin', () => {
      setServerUrl('https://example.com')
      expect(localStorage.getItem('server_base_url')).toBe(
        'https://example.com/api/v1',
      )
    })

    it('does not double-append /api/v1', () => {
      setServerUrl('https://example.com/api/v1')
      expect(localStorage.getItem('server_base_url')).toBe(
        'https://example.com/api/v1',
      )
    })

    it('strips trailing slashes before normalizing', () => {
      setServerUrl('https://example.com///')
      expect(localStorage.getItem('server_base_url')).toBe(
        'https://example.com/api/v1',
      )
    })

    it('trims whitespace', () => {
      setServerUrl('  https://example.com  ')
      expect(localStorage.getItem('server_base_url')).toBe(
        'https://example.com/api/v1',
      )
    })
  })

  describe('getServerUrl', () => {
    it('returns saved URL from localStorage', () => {
      localStorage.setItem('server_base_url', 'https://saved.com/api/v1')
      expect(getServerUrl()).toBe('https://saved.com/api/v1')
    })

    it('returns origin-based fallback on web when nothing saved', () => {
      mockIsNativePlatform.mockReturnValue(false)
      const result = getServerUrl()
      expect(result).toContain('/api/v1')
    })

    it('returns null on native when nothing saved', () => {
      mockIsNativePlatform.mockReturnValue(true)
      expect(getServerUrl()).toBeNull()
    })
  })

  describe('isServerConfigured', () => {
    it('returns true when URL is saved', () => {
      localStorage.setItem('server_base_url', 'https://example.com/api/v1')
      expect(isServerConfigured()).toBe(true)
    })

    it('returns true on web even without saved URL', () => {
      mockIsNativePlatform.mockReturnValue(false)
      expect(isServerConfigured()).toBe(true)
    })

    it('returns false on native without saved URL', () => {
      mockIsNativePlatform.mockReturnValue(true)
      expect(isServerConfigured()).toBe(false)
    })
  })

  describe('clearServerUrl', () => {
    it('removes saved URL', () => {
      localStorage.setItem('server_base_url', 'https://example.com/api/v1')
      clearServerUrl()
      expect(localStorage.getItem('server_base_url')).toBeNull()
    })
  })
})
