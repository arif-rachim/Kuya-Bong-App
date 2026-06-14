import type { CapacitorConfig } from '@capacitor/cli'

// Prepared for native builds (iOS/Android) later. The initial demo runs as static web.
const config: CapacitorConfig = {
  appId: 'com.reliefexpert.app',
  appName: 'Realief Expert',
  webDir: 'dist',
}

export default config
