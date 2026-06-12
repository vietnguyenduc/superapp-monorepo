/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_ENV: string
  readonly VITE_APP_VERSION: string
  readonly VITE_DEFAULT_LOCALE: string
  readonly VITE_DEFAULT_CURRENCY: string
  readonly VITE_DEFAULT_TIMEZONE: string
  readonly VITE_ENABLE_REALTIME: string
  readonly VITE_ENABLE_OFFLINE_MODE: string
  readonly VITE_DEBUG_MODE: string
  readonly VITE_LOG_LEVEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
