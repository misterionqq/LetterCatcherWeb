import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { registerDeviceToken, removeDeviceToken } from '@/api/profile.js'

const DEVICE_TOKEN_KEY = 'device_push_token'

export function usePushNotifications() {
  async function register() {
    if (!Capacitor.isNativePlatform()) return

    const permission = await PushNotifications.requestPermissions()
    if (permission.receive !== 'granted') return

    await PushNotifications.register()

    PushNotifications.addListener('registration', async ({ value: token }) => {
      try {
        localStorage.setItem(DEVICE_TOKEN_KEY, token)
        await registerDeviceToken(token)
      } catch (e) {
        console.error('Failed to send device token to server:', e)
      }
    })

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error)
    })
  }

  async function unregister() {
    const token = localStorage.getItem(DEVICE_TOKEN_KEY)
    if (!token) return

    try {
      await removeDeviceToken(token)
    } catch (e) {
      console.error('Failed to remove device token:', e)
    } finally {
      localStorage.removeItem(DEVICE_TOKEN_KEY)
    }
  }

  return { register, unregister }
}
