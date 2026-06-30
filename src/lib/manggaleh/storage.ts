/**
 * manggaleh object storage helpers for product photos. Images are uploaded as
 * storage objects and only their ids are kept in products.image_object_ids.
 *
 * Display fetches the object via the authenticated API download endpoint and
 * wraps it in an object URL, rather than the public getSignedUrl link — the
 * public manggaleh.com/files host doesn't reliably serve the raw bytes, while
 * the api.manggaleh.com download endpoint returns the real image. Values that
 * are already data:/http URLs pass through unchanged, so the mock store (base64)
 * and any legacy rows still render.
 */
import { mg } from './client'

// object id -> blob object URL (resolved once, kept for the app's lifetime)
const urlCache = new Map<string, string>()

/** Upload a compressed data URL and return the storage object id. */
export async function uploadDataUrl(dataUrl: string, name = 'photo.jpg'): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob()
  const obj = await mg().storage.upload(blob as unknown as File, { name })
  return (obj as { id: string }).id
}

/** Resolve a stored value (object id, or a data:/http URL) to a displayable URL. */
export async function resolveImageUrl(idOrUrl: string): Promise<string> {
  if (!idOrUrl) return ''
  if (idOrUrl.startsWith('data:') || idOrUrl.startsWith('http')) return idOrUrl
  const cached = urlCache.get(idOrUrl)
  if (cached) return cached
  const blob = await mg().storage.download(idOrUrl)
  const url = URL.createObjectURL(blob)
  urlCache.set(idOrUrl, url)
  return url
}
