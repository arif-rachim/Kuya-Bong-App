import { useState } from 'react'
import { TopBar } from '../../components/TopBar'
import { Banner, Button, Card, EmptyState, Field, Input, Select } from '../../components/ui'
import { Modal } from '../../components/Modal'
import { Icon } from '../../components/Icon'
import { PageIntro } from '../../components/PageIntro'
import { toast } from '../../components/Toast'
import { confirm } from '../../components/Confirm'
import { useApp } from '../../store/appStore'
import { useCurrentUser } from '../../store/selectors'
import { formatDate, todayISO } from '../../lib/date'
import { isManggalehEnabled } from '../../lib/manggaleh/client'
import { friendRequestFn, friendRespondFn, transferCreditFn } from '../../lib/manggaleh/write'
import type { Friend, User } from '../../data/types'

export function Friends() {
  const me = useCurrentUser()
  const users = useApp((s) => s.users)
  const friends = useApp((s) => s.friends)
  const patientPackages = useApp((s) => s.patientPackages)
  const requestFriend = useApp((s) => s.requestFriend)
  const acceptFriend = useApp((s) => s.acceptFriend)
  const declineFriend = useApp((s) => s.declineFriend)
  const removeFriend = useApp((s) => s.removeFriend)
  const transferCredit = useApp((s) => s.transferCredit)

  const [addOpen, setAddOpen] = useState(false)
  const [contact, setContact] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  const [xferTo, setXferTo] = useState<{ userId: string; name: string } | null>(null)
  const [xferPkgId, setXferPkgId] = useState('')
  const [xferSessions, setXferSessions] = useState('1')
  const [xferError, setXferError] = useState<string | null>(null)

  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? '—'
  const mine = friends.filter((f) => f.requesterUserId === me?.id || f.addresseeUserId === me?.id)
  const active = mine.filter((f) => f.status === 'active')
  const incoming = mine.filter((f) => f.status === 'pending' && f.addresseeUserId === me?.id)
  const outgoing = mine.filter((f) => f.status === 'pending' && f.requesterUserId === me?.id)
  const otherId = (f: { requesterUserId: string; addresseeUserId: string }) =>
    f.requesterUserId === me?.id ? f.addresseeUserId : f.requesterUserId
  const myActivePackages = patientPackages.filter((p) => p.ownerUserId === me?.id && p.remaining > 0 && p.expiryDate >= todayISO())

  async function submitAdd() {
    if (isManggalehEnabled()) {
      try {
        const r = await friendRequestFn(contact)
        const link: Friend = { id: r.id, requesterUserId: me?.id ?? '', addresseeUserId: r.addresseeUserId, status: 'pending' }
        const stub: User = { id: r.addresseeUserId, role: 'patient', name: r.addresseeName, mobile: '', email: '', password: '', verification: 'verified', active: true }
        useApp.setState((s) => ({
          friends: [...s.friends, link],
          users: s.users.some((u) => u.id === r.addresseeUserId) ? s.users : [...s.users, stub],
        }))
        setContact(''); setAddOpen(false); toast.success('Friend request sent.')
      } catch (e) {
        setAddError(e instanceof Error ? e.message : 'Could not send the friend request.')
      }
      return
    }
    const err = requestFriend(contact)
    if (err) return setAddError(err)
    setContact('')
    setAddOpen(false)
    toast.success('Friend request sent.')
  }

  async function accept(f: Friend) {
    if (isManggalehEnabled()) {
      try {
        await friendRespondFn(f.id, 'accept')
        useApp.setState((s) => ({ friends: s.friends.map((x) => (x.id === f.id ? { ...x, status: 'active' } : x)) }))
        toast.success('Friend added.')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not accept the request.')
      }
      return
    }
    acceptFriend(f.id); toast.success('Friend added.')
  }

  async function respondRemove(f: Friend, kind: 'decline' | 'remove') {
    if (isManggalehEnabled()) {
      try {
        await friendRespondFn(f.id, kind)
        useApp.setState((s) => ({ friends: s.friends.filter((x) => x.id !== f.id) }))
        toast[kind === 'decline' ? 'info' : 'success'](kind === 'decline' ? 'Request declined.' : 'Friend removed.')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not update the friend request.')
      }
      return
    }
    if (kind === 'decline') { declineFriend(f.id); toast.info('Request declined.') }
    else { removeFriend(f.id); toast.success('Friend removed.') }
  }

  function openTransfer(userId: string, name: string) {
    setXferTo({ userId, name })
    setXferPkgId(myActivePackages[0]?.id ?? '')
    setXferSessions('1')
    setXferError(null)
  }
  async function submitTransfer() {
    if (!xferTo) return
    const sessions = Number(xferSessions)
    if (isManggalehEnabled()) {
      const pkgId = xferPkgId
      try {
        const r = await transferCreditFn({ fromPackageId: pkgId, toUserId: xferTo.userId, sessions })
        useApp.setState((s) => ({
          patientPackages: s.patientPackages.map((p) => (p.id === pkgId ? { ...p, remaining: r.fromRemaining, status: r.fromRemaining <= 0 ? 'used' : p.status } : p)),
        }))
        setXferTo(null); toast.success('Package credit transferred.')
      } catch (e) {
        setXferError(e instanceof Error ? e.message : 'Could not transfer the credit.')
      }
      return
    }
    const err = transferCredit({ fromPackageId: xferPkgId, toUserId: xferTo.userId, sessions })
    if (err) return setXferError(err)
    setXferTo(null)
    toast.success('Package credit transferred.')
  }

  return (
    <div className="min-h-screen">
      <TopBar title="Friends" back right={<Button size="sm" onClick={() => { setContact(''); setAddError(null); setAddOpen(true) }}><Icon name="person_add" size={16} /> Add</Button>} />
      <div className="space-y-md px-margin-mobile py-md">
        <PageIntro>
          Friends are separate from Family. You can't book for a friend or use their package, but confirmed friends can
          transfer package sessions to each other (transferred sessions keep the original expiry date).
        </PageIntro>

        {incoming.length > 0 && (
          <section className="space-y-sm">
            <h2 className="font-label-lg text-label-lg text-on-surface">Requests for you</h2>
            {incoming.map((f) => (
              <Card key={f.id} className="flex items-center justify-between gap-sm">
                <p className="min-w-0 truncate font-label-lg text-label-lg text-on-surface">{userName(otherId(f))}</p>
                <div className="flex shrink-0 gap-sm">
                  <Button size="sm" onClick={() => accept(f)}>Accept</Button>
                  <Button size="sm" variant="secondary" onClick={() => respondRemove(f, 'decline')}>Decline</Button>
                </div>
              </Card>
            ))}
          </section>
        )}

        <section className="space-y-sm">
          <h2 className="font-label-lg text-label-lg text-on-surface">Your friends</h2>
          {active.length === 0 ? (
            <EmptyState icon="group" title="No friends yet" subtitle="Add a registered user to start sharing package credit." />
          ) : (
            active.map((f) => (
              <Card key={f.id}>
                <div className="flex items-center justify-between gap-sm">
                  <div className="flex min-w-0 items-center gap-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                      <Icon name="person" size={20} />
                    </div>
                    <p className="min-w-0 truncate font-label-lg text-label-lg text-on-surface">{userName(otherId(f))}</p>
                  </div>
                </div>
                <div className="mt-sm flex gap-sm">
                  <Button size="sm" onClick={() => openTransfer(otherId(f), userName(otherId(f)))}>
                    <Icon name="swap_horiz" size={16} /> Transfer credit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      const ok = await confirm({ title: 'Remove friend?', message: `Remove ${userName(otherId(f))} from your friends?`, confirmLabel: 'Remove', danger: true })
                      if (!ok) return
                      await respondRemove(f, 'remove')
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            ))
          )}
        </section>

        {outgoing.length > 0 && (
          <section className="space-y-sm">
            <h2 className="font-label-lg text-label-lg text-on-surface">Pending (sent)</h2>
            {outgoing.map((f) => (
              <Card key={f.id} className="flex items-center justify-between gap-sm">
                <p className="min-w-0 truncate font-label-lg text-label-lg text-on-surface">{userName(otherId(f))}</p>
                <span className="inline-flex items-center gap-xs rounded-full bg-tertiary-fixed px-sm py-xs font-label-md text-label-md text-on-tertiary-fixed-variant">
                  <Icon name="schedule" size={14} /> Pending
                </span>
              </Card>
            ))}
          </section>
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add a Friend">
        {addError && <div className="mb-sm"><Banner kind="error">{addError}</Banner></div>}
        <div className="space-y-sm">
          <Field label="Friend's email or mobile" hint="They must be a registered user and confirm the request.">
            <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="name@email.com" />
          </Field>
          <Button size="lg" onClick={submitAdd}>Send request</Button>
        </div>
      </Modal>

      <Modal open={!!xferTo} onClose={() => setXferTo(null)} title={`Transfer Credit to ${xferTo?.name ?? ''}`}>
        {xferError && <div className="mb-sm"><Banner kind="error">{xferError}</Banner></div>}
        {myActivePackages.length === 0 ? (
          <Banner kind="info">You have no active package with sessions to transfer.</Banner>
        ) : (
          <div className="space-y-sm">
            <Field label="From package">
              <Select value={xferPkgId} onChange={(e) => setXferPkgId(e.target.value)}>
                {myActivePackages.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.remaining} left (exp {formatDate(p.expiryDate)})</option>
                ))}
              </Select>
            </Field>
            <Field label="Sessions to transfer">
              <Input type="number" min={1} value={xferSessions} onChange={(e) => setXferSessions(e.target.value)} />
            </Field>
            <Banner kind="info">Transferred sessions keep the original expiry date.</Banner>
            <Button size="lg" onClick={submitTransfer}>Transfer</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
