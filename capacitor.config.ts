import type { CapacitorConfig } from '@capacitor/cli'

// Disiapkan untuk native build (iOS/Android) nanti. Demo awal lewat static web.
const config: CapacitorConfig = {
  appId: 'com.reliefexpert.app',
  appName: 'Realief Expert',
  webDir: 'dist',
}

export default config
