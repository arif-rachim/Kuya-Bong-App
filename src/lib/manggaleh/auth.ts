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

/** Email OTP verification (mirrors the demo's mock OTP flow). */
export async function mgSendOtp(email: string): Promise<void> {
  await mg().auth.sendOtp(email, 'email-verification')
}

export async function mgVerifyOtp(email: string, otp: string): Promise<MgUser> {
  return (await mg().auth.signInWithOtp({ email, otp })).user
}
