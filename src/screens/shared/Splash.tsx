import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { useApp } from '../../store/appStore'
import { homePathFor } from '../../store/selectors'

export function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    // Session restore + hydration already happened in the app-level boot gate (App.tsx);
    // here we just route based on the (already hydrated) current user.
    const route = () => {
      const s = useApp.getState()
      navigate(homePathFor(s.users.find((u) => u.id === s.currentUserId) ?? null, s.therapists), { replace: true })
    }
    const t = setTimeout(() => { if (alive) route() }, 700)
    return () => { alive = false; clearTimeout(t) }
  }, [navigate])

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-primary text-on-primary">
      <Logo variant="onDark" tagline className="text-4xl" />
      <p className="mt-lg text-body-md text-white/80">Physiotherapy &amp; Chiropractic</p>
    </div>
  )
}
