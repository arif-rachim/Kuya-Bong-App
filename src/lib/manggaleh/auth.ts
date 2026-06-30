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
 * Email verification at registration. Sends an 'email-verification' code and
 * verifies it with verifyEmail — which only marks the email verified, without
 * creating an account or minting a new session (the user is already signed in
 * from signUp). Unlike signInWithOtp this never creates an orphan passwordless
 * account. (SDK ≥0.5.0.)
 */
export async function mgSendOtp(email: string): Promise<void> {
  await mg().auth.sendOtp(email.trim().toLowerCase(), 'email-verification')
}

export async function mgVerifyOtp(email: string, otp: string): Promise<void> {
  await mg().auth.verifyEmail({ email: email.trim().toLowerCase(), otp: otp.trim() })
}

/** Change the signed-in user's password (revokes other sessions). */
export async function mgChangePassword(currentPassword: string, newPassword: string): Promise<void> {
  await mg().auth.changePassword({ currentPassword, newPassword, revokeOtherSessions: true })
}

/** Request a password-reset email. `redirectTo` is where the emailed link lands (carrying the token). */
export async function mgForgetPassword(email: string, redirectTo: string): Promise<void> {
  await mg().auth.forgetPassword({ email: email.trim().toLowerCase(), redirectTo })
}

/** Complete a password reset using the token from the emailed link. */
export async function mgResetPassword(token: string, newPassword: string): Promise<void> {
  await mg().auth.resetPassword({ token, newPassword })
}
