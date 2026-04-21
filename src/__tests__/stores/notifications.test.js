import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/emails.js', () => ({
  getHistory: vi.fn(),
  getStats: vi.fn(),
}))

import { useNotificationsStore } from '@/stores/notifications.js'
import * as emailsApi from '@/api/emails.js'

describe('notifications store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchHistory', () => {
    it('loads history and manages loading state', async () => {
      const mockHistory = [{ email_uid: '1', subject: 'Test' }]
      emailsApi.getHistory.mockResolvedValue(mockHistory)

      const store = useNotificationsStore()
      const promise = store.fetchHistory(10)

      expect(store.loading).toBe(true)
      await promise
      expect(store.loading).toBe(false)
      expect(store.historyMeta).toEqual(mockHistory)
      expect(emailsApi.getHistory).toHaveBeenCalledWith(10)
    })

    it('uses default limit of 50', async () => {
      emailsApi.getHistory.mockResolvedValue([])
      const store = useNotificationsStore()
      await store.fetchHistory()
      expect(emailsApi.getHistory).toHaveBeenCalledWith(50)
    })

    it('resets loading on error', async () => {
      emailsApi.getHistory.mockRejectedValue(new Error('fail'))
      const store = useNotificationsStore()
      await expect(store.fetchHistory()).rejects.toThrow('fail')
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchStats', () => {
    it('loads stats', async () => {
      const mockStats = { total: 42 }
      emailsApi.getStats.mockResolvedValue(mockStats)
      const store = useNotificationsStore()

      await store.fetchStats()

      expect(store.stats).toEqual(mockStats)
    })
  })

  describe('addEmail', () => {
    it('adds email to the beginning', () => {
      const store = useNotificationsStore()
      store.addEmail({ email_uid: '1', subject: 'First' })
      store.addEmail({ email_uid: '2', subject: 'Second' })

      expect(store.emails).toHaveLength(2)
      expect(store.emails[0].email_uid).toBe('2')
    })

    it('prevents duplicates by email_uid', () => {
      const store = useNotificationsStore()
      store.addEmail({ email_uid: '1', subject: 'First' })
      store.addEmail({ email_uid: '1', subject: 'Duplicate' })

      expect(store.emails).toHaveLength(1)
      expect(store.emails[0].subject).toBe('First')
    })
  })

  describe('getEmailByUid', () => {
    it('finds email in full emails list', () => {
      const store = useNotificationsStore()
      store.addEmail({ email_uid: 'abc', subject: 'Found' })

      expect(store.getEmailByUid('abc')).toEqual({
        email_uid: 'abc',
        subject: 'Found',
      })
    })

    it('falls back to historyMeta', async () => {
      emailsApi.getHistory.mockResolvedValue([
        { email_uid: 'hist', subject: 'History' },
      ])
      const store = useNotificationsStore()
      await store.fetchHistory()

      expect(store.getEmailByUid('hist')).toEqual({
        email_uid: 'hist',
        subject: 'History',
      })
    })

    it('returns null when not found', () => {
      const store = useNotificationsStore()
      expect(store.getEmailByUid('nonexistent')).toBeNull()
    })

    it('prefers full email over historyMeta', async () => {
      emailsApi.getHistory.mockResolvedValue([
        { email_uid: 'x', subject: 'Meta' },
      ])
      const store = useNotificationsStore()
      await store.fetchHistory()
      store.addEmail({ email_uid: 'x', subject: 'Full', body_html: '<p>' })

      const found = store.getEmailByUid('x')
      expect(found.subject).toBe('Full')
      expect(found.body_html).toBe('<p>')
    })
  })

  describe('isFullEmail', () => {
    it('returns true for email with body_html', () => {
      const store = useNotificationsStore()
      store.addEmail({ email_uid: '1', body_html: '<p>Hi</p>' })
      expect(store.isFullEmail('1')).toBe(true)
    })

    it('returns true for email with body_full', () => {
      const store = useNotificationsStore()
      store.addEmail({ email_uid: '1', body_full: 'Hello' })
      expect(store.isFullEmail('1')).toBe(true)
    })

    it('returns false for metadata-only email', () => {
      const store = useNotificationsStore()
      store.addEmail({ email_uid: '1', subject: 'No body' })
      expect(store.isFullEmail('1')).toBe(false)
    })

    it('returns false for unknown email', () => {
      const store = useNotificationsStore()
      expect(store.isFullEmail('unknown')).toBe(false)
    })
  })

  describe('setPendingDnd', () => {
    it('sets pending DnD list', () => {
      const store = useNotificationsStore()
      store.setPendingDnd(['a@test.com', 'b@test.com'])
      expect(store.pendingDnd).toEqual(['a@test.com', 'b@test.com'])
    })
  })
})
