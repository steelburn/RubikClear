import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rubikclear.app',
  appName: 'RubikClear',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
