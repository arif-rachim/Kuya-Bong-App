let counter = 0
/** Lightweight unique ID for mock data. */
export function uid(prefix = 'id'): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter}-${Math.floor(Math.random() * 1e4)}`
}
