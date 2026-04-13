import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { registerDeviceToken } from '@/api/profile.js'

export function usePushNotifications() {
  async function register() {
    if (!Capacitor.isNativePlatform()) return

    const permission = await PushNotifications.requestPermissions()
    if (permission.receive !== 'granted') return

    await PushNotifications.register()

    PushNotifications.addListener('registration', async ({ value: token }) => {
      try {
        await registerDeviceToken(token)
      } catch (e) {
        console.error('Failed to send device token to server:', e)
      }
    })

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error)
    })
  }

  return { register }
}
