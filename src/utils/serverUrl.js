import { Capacitor } from '@capacitor/core'

const STORAGE_KEY = 'server_base_url'

/**
 * Returns the full API base URL (e.g. https://example.com/api/v1).
 * - Web: defaults to VITE_API_BASE_URL or same-origin /api/v1
 * - Mobile (native): returns null if not configured
 */
export function getServerUrl() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) return saved

  if (!Capacitor.isNativePlatform()) {
    return import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api/v1`
  }

  return null
}

/**
 * Saves the server URL. Accepts a bare origin (https://example.com)
 * or a full path — normalizes to end with /api/v1.
 */
export function setServerUrl(url) {
  let normalized = url.trim().replace(/\/+$/, '')
  if (!normalized.endsWith('/api/v1')) {
    normalized += '/api/v1'
  }
  localStorage.setItem(STORAGE_KEY, normalized)
}

export function isServerConfigured() {
  return !!getServerUrl()
}

export function clearServerUrl() {
  localStorage.removeItem(STORAGE_KEY)
}
