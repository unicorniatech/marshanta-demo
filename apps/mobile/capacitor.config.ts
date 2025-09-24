import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.marshanta.app',
  appName: 'Marshanta',
  webDir: '../web/dist',
  server: {
    androidScheme: 'https'
  }
}

export default config
