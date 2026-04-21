import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/profile.js', () => ({
  getProfile: vi.fn(),
  updateEmail: vi.fn(),
  setSensitivity: vi.fn(),
  toggleDnd: vi.fn(),
  getPendingDnd: vi.fn(),
  linkTelegram: vi.fn(),
}))

vi.mock('@/api/keywords.js', () => ({
  addKeyword: vi.fn(),
  addStopWord: vi.fn(),
  removeKeyword: vi.fn(),
}))

vi.mock('@/api/settings.js', () => ({
  getServerInfo: vi.fn(),
}))

import { useProfileStore } from '@/stores/profile.js'
import * as profileApi from '@/api/profile.js'
import * as keywordsApi from '@/api/keywords.js'
import { getServerInfo } from '@/api/settings.js'

describe('profile store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchProfile', () => {
    it('loads profile and manages loading state', async () => {
      const mockProfile = { email: 'user@test.com', keywords: [] }
      profileApi.getProfile.mockResolvedValue(mockProfile)

      const store = useProfileStore()
      const promise = store.fetchProfile()

      expect(store.loading).toBe(true)
      await promise
      expect(store.loading).toBe(false)
      expect(store.profile).toEqual(mockProfile)
      expect(store.error).toBeNull()
    })

    it('sets error on failure and re-throws', async () => {
      const err = new Error('Network error')
      profileApi.getProfile.mockRejectedValue(err)

      const store = useProfileStore()
      await expect(store.fetchProfile()).rejects.toThrow('Network error')
      expect(store.loading).toBe(false)
      expect(store.error).toBe(err)
    })
  })

  describe('updateEmail', () => {
    it('delegates to API and returns result', async () => {
      profileApi.updateEmail.mockResolvedValue({ message: 'verification sent' })
      const store = useProfileStore()

      const result = await store.updateEmail('new@test.com')

      expect(profileApi.updateEmail).toHaveBeenCalledWith('new@test.com')
      expect(result).toEqual({ message: 'verification sent' })
    })
  })

  describe('setSensitivity', () => {
    it('updates profile with new sensitivity', async () => {
      const updated = { sensitivity: 'high' }
      profileApi.setSensitivity.mockResolvedValue(updated)
      const store = useProfileStore()

      await store.setSensitivity('high')

      expect(store.profile).toEqual(updated)
      expect(profileApi.setSensitivity).toHaveBeenCalledWith('high')
    })
  })

  describe('keyword management', () => {
    it('addKeyword updates profile', async () => {
      const updated = { keywords: ['test'] }
      keywordsApi.addKeyword.mockResolvedValue(updated)
      const store = useProfileStore()

      await store.addKeyword('test')

      expect(store.profile).toEqual(updated)
      expect(keywordsApi.addKeyword).toHaveBeenCalledWith('test')
    })

    it('addStopWord updates profile', async () => {
      const updated = { stop_words: ['spam'] }
      keywordsApi.addStopWord.mockResolvedValue(updated)
      const store = useProfileStore()

      await store.addStopWord('spam')

      expect(store.profile).toEqual(updated)
      expect(keywordsApi.addStopWord).toHaveBeenCalledWith('spam')
    })

    it('removeKeyword updates profile', async () => {
      const updated = { keywords: [] }
      keywordsApi.removeKeyword.mockResolvedValue(updated)
      const store = useProfileStore()

      await store.removeKeyword('test')

      expect(store.profile).toEqual(updated)
      expect(keywordsApi.removeKeyword).toHaveBeenCalledWith('test')
    })
  })

  describe('toggleDnd', () => {
    it('delegates to API', async () => {
      profileApi.toggleDnd.mockResolvedValue({ dnd: true })
      const store = useProfileStore()

      const result = await store.toggleDnd()

      expect(profileApi.toggleDnd).toHaveBeenCalled()
      expect(result).toEqual({ dnd: true })
    })
  })

  describe('fetchServerInfo', () => {
    it('saves forwarding email and bot username', async () => {
      getServerInfo.mockResolvedValue({
        forwarding_email: 'fwd@test.com',
        bot_username: 'mybot',
      })
      const store = useProfileStore()

      await store.fetchServerInfo()

      expect(store.forwardingEmail).toBe('fwd@test.com')
      expect(store.botUsername).toBe('mybot')
    })

    it('keeps defaults when fields are missing', async () => {
      getServerInfo.mockResolvedValue({})
      const store = useProfileStore()

      await store.fetchServerInfo()

      expect(store.forwardingEmail).toBe('')
      expect(store.botUsername).toBe('')
    })

    it('silently handles API failure', async () => {
      getServerInfo.mockRejectedValue(new Error('unavailable'))
      const store = useProfileStore()

      await store.fetchServerInfo()

      expect(store.forwardingEmail).toBe('')
      expect(store.botUsername).toBe('')
    })
  })
})
