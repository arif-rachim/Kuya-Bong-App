/** Thin auth wrappers over the manggaleh SDK (returns the app-facing user shape). */
import { mg } from './client'

export interface MgUser {
  id: string
  email: string
  name: string
  emailVerified?: boolean
}

export async function mgSignUp(input: { email: string; password: string; name: string; code?: string }): Promise<MgUser> {
  return (await mg().auth.signUp(input)).user
}

export async function mgSignIn(email: string, password: string): Promise<MgUser> {
  return (await mg().auth.signIn({ email, password })).user
}

export async function mgSignOut(): Promise<void> {
  await mg().auth.signOut()
}

export async function mgGetSession(): Promise<MgUser | null> {
  return (await mg().auth.getSession())?.user ?? null
}

/**
 * Email OTP verification at registration, via manggaleh's built-in email-OTP.
 * We send a 'sign-in' code (the type paired with signInWithOtp) and verify it,
 * proving the user owns the email. Requires email delivery configured server-side
 * (Resend) — which is live for this tenant.
 */
export async function mgSendOtp(email: string): Promise<void> {
  await mg().auth.sendOtp(email.trim().toLowerCase(), 'sign-in')
}

export async function mgVerifyOtp(email: string, otp: string): Promise<MgUser> {
  return (await mg().auth.signInWithOtp({ email: email.trim().toLowerCase(), otp: otp.trim() })).user
}
