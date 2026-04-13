import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.lettercatcher.app',
  appName: 'LetterCatcher',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
