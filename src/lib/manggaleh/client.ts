/**
 * manggaleh.com backend client (https://manggaleh.com/documentation.html).
 *
 * The app still runs fully on the local mock store by default. When
 * VITE_USE_MANGGALEH=true (and a tenant + publishable key are provided), the
 * data layer can route through this client instead. Keeping the toggle here
 * lets us migrate one feature slice at a time without breaking the demo.
 */
import { createClient, type ManggalehClient } from '@manggaleh/sdk'

const TOKEN_KEY = 'mg_token'

const config = {
  baseUrl: import.meta.env.VITE_MANGGALEH_BASE_URL ?? 'https://api.manggaleh.com',
  tenant: import.meta.env.VITE_MANGGALEH_TENANT ?? '',
  env: import.meta.env.VITE_MANGGALEH_ENV ?? 'dev',
  apiKey: import.meta.env.VITE_MANGGALEH_API_KEY ?? '',
}

/** True when manggaleh is switched on and the minimum credentials are present. */
export function isManggalehEnabled(): boolean {
  return import.meta.env.VITE_USE_MANGGALEH === 'true' && !!config.tenant && !!config.apiKey
}

/**
 * True when registration should require email-OTP verification. Off by default:
 * it needs email delivery configured in manggaleh (Resend, or DEV_OTP_CODE),
 * otherwise send-verification-otp returns 500 and registration would stall.
 */
export function isManggalehOtpEnabled(): boolean {
  return isManggalehEnabled() && import.meta.env.VITE_MANGGALEH_OTP === 'true'
}

/** True when a manggaleh session token is stored locally (a session may be restorable). */
export function hasStoredSession(): boolean {
  return typeof localStorage !== 'undefined' && !!localStorage.getItem(TOKEN_KEY)
}

let _client: ManggalehClient | null = null

/** Lazily-created singleton client (publishable key, browser-safe). */
export function mg(): ManggalehClient {
  if (!_client) {
    _client = createClient({
      baseUrl: config.baseUrl,
      tenant: config.tenant,
      env: config.env,
      apiKey: config.apiKey,
      // SDK requires a {get,set} adapter — never pass localStorage directly.
      storage: {
        get: () => localStorage.getItem(TOKEN_KEY),
        set: (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY)),
      },
    })
  }
  return _client
}

export { ManggalehError } from '@manggaleh/sdk'
