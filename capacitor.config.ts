import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.student.workledger',
  appName: '工时账本',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#f2f4f7',
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#f2f4f7',
      showSpinner: false,
    },
    SystemBars: {
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
    },
  },
}

export default config
