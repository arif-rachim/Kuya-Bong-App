import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { useApp } from '../../store/appStore'
import { homePathFor } from '../../store/selectors'

export function Splash() {
  const navigate = useNavigate()
  const path = useApp((s) => homePathFor(s.users.find((u) => u.id === s.currentUserId) ?? null, s.therapists))

  useEffect(() => {
    const t = setTimeout(() => {
      navigate(path, { replace: true })
    }, 900)
    return () => clearTimeout(t)
  }, [path, navigate])

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-primary text-on-primary">
      <Logo variant="onDark" tagline className="text-4xl" />
      <p className="mt-lg text-body-md text-white/80">Physiotherapy &amp; Chiropractic</p>
    </div>
  )
}
