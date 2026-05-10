export const APP_CONFIG = {
  appName: 'AnySing',
  platformTarget: 'android-pad',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://192.168.50.164:8080',
  apiTimeoutMs: 30000,
} as const;
