/**
 * Thin wrapper to invoke manggaleh serverless Functions. Admin/cross-user
 * operations (list-all, assign package, transfer credit, deactivate user,
 * booking conflict check, audit) run as Functions because RLS is user-centric;
 * each Function uses the SERVICE_KEY secret + ctx.fetch to act as admin.
 * See functions/ for the deployed sources.
 */
import { mg } from './client'

export function invokeFn<R = unknown>(name: string, input?: unknown): Promise<R> {
  return mg().functions.invoke<R>(name, input)
}
