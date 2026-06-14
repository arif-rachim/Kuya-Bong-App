import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { useApp } from '../../store/appStore'

export function Splash() {
  const navigate = useNavigate()
  const role = useApp((s) => s.users.find((u) => u.id === s.currentUserId)?.role)

  useEffect(() => {
    const t = setTimeout(() => {
      if (role === 'admin') navigate('/admin/dashboard', { replace: true })
      else if (role === 'patient') navigate('/patient/home', { replace: true })
      else navigate('/welcome', { replace: true })
    }, 900)
    return () => clearTimeout(t)
  }, [role, navigate])

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-primary text-on-primary">
      <Logo variant="onDark" tagline className="text-4xl" />
      <p className="mt-lg text-body-md text-white/80">Physiotherapy &amp; Chiropractic</p>
    </div>
  )
}
