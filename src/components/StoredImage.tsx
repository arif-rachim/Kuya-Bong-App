import { useEffect, useState } from 'react'
import { resolveImageUrl } from '../lib/manggaleh/storage'

/**
 * Renders an image from a stored value that may be a manggaleh storage object id
 * or a plain data:/http URL. Resolves object ids to signed URLs (cached) and
 * shows a neutral placeholder while resolving.
 */
export function StoredImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [url, setUrl] = useState(() => (src.startsWith('data:') || src.startsWith('http') ? src : ''))

  useEffect(() => {
    let alive = true
    resolveImageUrl(src).then((u) => alive && setUrl(u)).catch(() => alive && setUrl(''))
    return () => { alive = false }
  }, [src])

  if (!url) return <div className={className} aria-hidden />
  return <img src={url} alt={alt} className={className} />
}
