/**
 * Thin wrapper to invoke manggaleh serverless Functions. Admin/cross-user
 * operations (list-all, assign package, transfer credit, deactivate user,
 * booking conflict check, audit) run as Functions because RLS is user-centric;
 * each Function uses the SERVICE_KEY secret + ctx.fetch to act as admin.
 * See functions/ for the deployed sources.
 */
import { mg } from './client'

const TOKEN_KEY = 'mg_token'

/**
 * Invoke a Function, attaching the caller's session token as `__callerToken`.
 * The Function runtime does NOT receive the Authorization header, so admin
 * Functions re-resolve the caller from this token (via /auth/get-session) and
 * check their app_users role server-side — otherwise any logged-in user could
 * invoke an admin Function with the public publishable key.
 */
export function invokeFn<R = unknown>(name: string, input?: unknown): Promise<R> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
  return mg().functions.invoke<R>(name, { ...(input as Record<string, unknown> | undefined ?? {}), __callerToken: token })
}
