/** Thin auth wrappers over the manggaleh SDK (returns the app-facing user shape). */
import { mg } from './client'
import { invokeFn } from './fns'

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
 * Email OTP verification at registration. manggaleh's built-in /auth/email-otp
 * endpoint currently 500s, but ctx.email.send (Resend) works — so we run our own
 * OTP via the otp_send / otp_verify Functions. The code targets the signed-in
 * caller's own email (the account was just created + signed in by signUp).
 */
export async function mgSendOtp(_email?: string): Promise<void> {
  const r = await invokeFn<{ ok?: boolean; error?: string }>('otp_send')
  if (r.error || !r.ok) throw new Error(r.error || 'Could not send the verification code.')
}

export async function mgVerifyOtp(_email: string, otp: string): Promise<void> {
  const r = await invokeFn<{ ok?: boolean; error?: string }>('otp_verify', { code: otp.trim() })
  if (r.error || !r.ok) throw new Error(r.error || 'That code is incorrect or has expired.')
}
