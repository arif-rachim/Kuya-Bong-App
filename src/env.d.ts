/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Master switch — when 'true' (and tenant+key set) the app talks to manggaleh. */
  readonly VITE_USE_MANGGALEH?: string
  readonly VITE_MANGGALEH_BASE_URL?: string
  readonly VITE_MANGGALEH_TENANT?: string
  readonly VITE_MANGGALEH_ENV?: string
  readonly VITE_MANGGALEH_API_KEY?: string
  /** When 'true', require email-OTP verification at registration (needs email delivery configured in manggaleh). */
  readonly VITE_MANGGALEH_OTP?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
