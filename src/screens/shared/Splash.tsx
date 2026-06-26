import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { useApp } from '../../store/appStore'
import { homePathFor } from '../../store/selectors'
import { isManggalehEnabled } from '../../lib/manggaleh/client'
import { hydrateFromManggaleh } from '../../lib/manggaleh/hydrate'

export function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    const route = () => {
      const s = useApp.getState()
      navigate(homePathFor(s.users.find((u) => u.id === s.currentUserId) ?? null, s.therapists), { replace: true })
    }
    const boot = async () => {
      // Restore a manggaleh session (and hydrate) before routing.
      if (isManggalehEnabled()) await hydrateFromManggaleh().catch(() => {})
      await new Promise((r) => setTimeout(r, 700))
      if (alive) route()
    }
    boot()
    return () => { alive = false }
  }, [navigate])

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-primary text-on-primary">
      <Logo variant="onDark" tagline className="text-4xl" />
      <p className="mt-lg text-body-md text-white/80">Physiotherapy &amp; Chiropractic</p>
    </div>
  )
}
