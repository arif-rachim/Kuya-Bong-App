import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../../components/TopBar'
import { Banner, Button, Card, Field, Input } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/Modal'
import { PageIntro } from '../../components/PageIntro'
import { toast } from '../../components/Toast'
import { confirm } from '../../components/Confirm'
import { useApp } from '../../store/appStore'
import { useCurrentProfile, useCurrentUser } from '../../store/selectors'
import { isManggalehEnabled } from '../../lib/manggaleh/client'
import { updateMyProfile } from '../../lib/manggaleh/write'
import { mgChangePassword } from '../../lib/manggaleh/auth'

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Profile() {
  const navigate = useNavigate()
  const user = useCurrentUser()
  const profile = useCurrentProfile()
  const updateProfile = useApp((s) => s.updateProfile)
  const changePassword = useApp((s) => s.changePassword)
  const logout = useApp((s) => s.logout)

  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    mobile: user?.mobile ?? '',
    address: profile?.address ?? '',
    emergencyContact: profile?.emergencyContact ?? '',
  })
  const [pwModal, setPwModal] = useState(false)
  const [pw, setPw] = useState({ current: '', next: '' })
  const [pwErr, setPwErr] = useState<string | null>(null)

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function save() {
    if (isManggalehEnabled()) {
      try {
        if (profile) await updateMyProfile(profile.id, { address: form.address, emergencyContact: form.emergencyContact })
        useApp.setState((s) => ({
          users: s.users.map((u) => (u.id === s.currentUserId ? { ...u, name: form.name.trim() } : u)),
          profiles: s.profiles.map((p) => (p.userId === s.currentUserId ? { ...p, address: form.address, emergencyContact: form.emergencyContact } : p)),
        }))
        toast.success('Profile saved.')
      } catch { toast.error('Could not save profile.') }
      return
    }
    const err = updateProfile(form)
    if (err) return toast.error(err)
    toast.success('Profile saved.')
  }

  async function savePassword() {
    if (pw.next.length < 6) return setPwErr('New password must be at least 6 characters.')
    if (isManggalehEnabled()) {
      try {
        await mgChangePassword(pw.current, pw.next)
        setPwModal(false); setPw({ current: '', next: '' }); setPwErr(null)
        toast.success('Password updated.')
      } catch {
        setPwErr('Could not change password. Check your current password.')
      }
      return
    }
    const err = changePassword(pw.current, pw.next)
    if (err) return setPwErr(err)
    setPwModal(false)
    setPw({ current: '', next: '' })
    setPwErr(null)
    toast.success('Password updated.')
  }

  async function doLogout() {
    const ok = await confirm({
      title: 'Log out?',
      message: "You'll need to sign in again to access your account.",
      confirmLabel: 'Log out',
      danger: true,
    })
    if (!ok) return
    logout()
    navigate('/welcome', { replace: true })
  }

  return (
    <div>
      <TopBar title="Profile" />
      <div className="px-margin-mobile pt-md">
        <PageIntro>
          Keep your contact details up to date so the clinic can reach you. Here you can edit your name, email, mobile,
          and address, change your password, or log out.
        </PageIntro>
      </div>

      <div className="space-y-md px-margin-mobile py-md">
        <Card className="flex items-center gap-md">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-secondary-fixed bg-primary-fixed font-headline-md text-headline-md text-on-primary-fixed">
            {initials(form.name || user?.name || '?')}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-headline-sm text-headline-sm text-on-surface">{form.name || user?.name}</h3>
            <p className="truncate font-label-lg text-label-lg text-on-surface-variant">{user?.email}</p>
          </div>
        </Card>

        <Card className="space-y-md">
          <Field label="Full name">
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Mobile number">
            <Input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
          <Field label="Emergency contact">
            <Input value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} />
          </Field>
          <Button size="lg" onClick={save}>Save Changes</Button>
        </Card>

        <Button variant="secondary" size="lg" onClick={() => { setPwModal(true); setPwErr(null) }}>
          <Icon name="lock" size={20} /> Change Password
        </Button>

        <Button variant="danger" size="lg" onClick={doLogout}>
          <Icon name="logout" size={20} /> Log Out
        </Button>
      </div>

      <Modal open={pwModal} onClose={() => setPwModal(false)} title="Change Password">
        {pwErr && <div className="mb-sm"><Banner kind="error">{pwErr}</Banner></div>}
        <div className="space-y-sm">
          <Field label="Current password">
            <Input type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} />
          </Field>
          <Field label="New password" hint="At least 6 characters">
            <Input type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} />
          </Field>
          <Button size="lg" onClick={savePassword}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}
