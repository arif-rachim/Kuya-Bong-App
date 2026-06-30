import { useState } from 'react'
import { TopBar } from '../../components/TopBar'
import { Banner, Button, Card, EmptyState, Field, Input, SectionTitle } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/Modal'
import { PageIntro } from '../../components/PageIntro'
import { toast } from '../../components/Toast'
import { confirm } from '../../components/Confirm'
import { useApp } from '../../store/appStore'
import { useCurrentProfile, useCurrentUser } from '../../store/selectors'
import { isManggalehEnabled } from '../../lib/manggaleh/client'
import { addChildMember, linkAdultFn, familyRespondFn } from '../../lib/manggaleh/write'
import type { FamilyMember, User } from '../../data/types'

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Family() {
  const user = useCurrentUser()
  const profile = useCurrentProfile()
  const allFamily = useApp((s) => s.family)
  const profiles = useApp((s) => s.profiles)
  const users = useApp((s) => s.users)
  const members = allFamily.filter((m) => m.familyGroupId === profile?.familyGroupId)
  // Link requests where I'm the invited adult and haven't accepted yet.
  const incoming = allFamily.filter((m) => m.linkedUserId === user?.id && m.status === 'pending')
  const addChild = useApp((s) => s.addChild)
  const linkAdult = useApp((s) => s.linkAdult)
  const acceptLink = useApp((s) => s.acceptLink)
  const declineLink = useApp((s) => s.declineLink)
  const removeFamilyMember = useApp((s) => s.removeFamilyMember)

  function inviterName(familyGroupId: string) {
    const inviter = profiles.find((p) => p.familyGroupId === familyGroupId)
    return users.find((u) => u.id === inviter?.userId)?.name ?? 'A patient'
  }

  async function acceptRequest(memberId: string, fromGroup: string) {
    const from = inviterName(fromGroup)
    const ok = await confirm({
      title: 'Accept link request?',
      message: `Link with ${from} and share their treatment packages?`,
      confirmLabel: 'Accept',
    })
    if (!ok) return
    if (isManggalehEnabled()) {
      try {
        await familyRespondFn(memberId, 'accept')
        useApp.setState((s) => ({ family: s.family.map((m) => (m.id === memberId ? { ...m, status: 'active' } : m)) }))
        toast.success(`You're now linked with ${from}.`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not accept the request.')
      }
      return
    }
    acceptLink(memberId)
    toast.success(`You're now linked with ${from}.`)
  }

  async function declineRequest(memberId: string, fromGroup: string) {
    const ok = await confirm({
      title: 'Decline request?',
      message: `Decline the link request from ${inviterName(fromGroup)}?`,
      confirmLabel: 'Decline',
      danger: true,
    })
    if (!ok) return
    if (isManggalehEnabled()) {
      try {
        await familyRespondFn(memberId, 'decline')
        useApp.setState((s) => ({ family: s.family.filter((m) => m.id !== memberId) }))
        toast.info('Request declined.')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not decline the request.')
      }
      return
    }
    declineLink(memberId)
    toast.info('Request declined.')
  }

  async function removeMember(id: string, name: string, isChild: boolean) {
    const ok = await confirm({
      title: isChild ? 'Remove child?' : 'Remove family member?',
      message: isChild
        ? `Remove ${name} from your family? Past package usage history is kept.`
        : `Unlink ${name}? They will no longer share your treatment packages. Past usage history is kept.`,
      confirmLabel: 'Remove',
      cancelLabel: 'Keep',
      danger: true,
    })
    if (!ok) return
    if (isManggalehEnabled()) {
      try {
        await familyRespondFn(id, 'remove')
        useApp.setState((s) => ({ family: s.family.filter((m) => m.id !== id) }))
        toast.success(`${name} removed.`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not remove the member.')
      }
      return
    }
    removeFamilyMember(id)
    toast.success(`${name} removed.`)
  }

  const [modal, setModal] = useState<'child' | 'adult' | null>(null)
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submitChild() {
    if (!name.trim()) return setError('Child\'s name can\'t be empty.')
    if (isManggalehEnabled()) {
      try {
        const id = await addChildMember(user!.id, name)
        useApp.setState((s) => ({ family: [...s.family, { id, familyGroupId: user!.id, name: name.trim(), relationship: 'child', isChild: true, parentUserId: user!.id, status: 'active' }] }))
        reset('Child added successfully.')
      } catch { setError('Could not add child. Please try again.') }
      return
    }
    const err = addChild(user!.id, name)
    if (err) return setError(err)
    reset('Child added successfully.')
  }
  async function submitAdult() {
    if (!contact.trim()) return setError('Enter an email or mobile number.')
    if (isManggalehEnabled()) {
      try {
        const r = await linkAdultFn(contact)
        const member: FamilyMember = {
          id: r.id, familyGroupId: user!.id, name: r.name, relationship: 'spouse', isChild: false,
          linkedUserId: r.linkedUserId, parentUserId: user!.id, status: 'pending',
        }
        const stub: User = { id: r.linkedUserId, role: 'patient', name: r.name, mobile: '', email: '', password: '', verification: 'verified', active: true }
        useApp.setState((s) => ({
          family: [...s.family, member],
          users: s.users.some((u) => u.id === r.linkedUserId) ? s.users : [...s.users, stub],
        }))
        reset('Link request sent. Awaiting approval.')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not send the link request.')
      }
      return
    }
    const err = linkAdult(user!.id, contact)
    if (err) return setError(err)
    reset('Link request sent. Awaiting approval.')
  }
  function reset(message: string) {
    setModal(null)
    setName('')
    setContact('')
    setError(null)
    toast.success(message)
  }

  return (
    <div>
      <TopBar title="Family" />
      <div className="px-margin-mobile pt-md">
        <PageIntro>
          Share your treatment packages with family. Add a child (no separate login needed) or link a spouse by their
          registered email/mobile — they confirm from their own account. Incoming link requests appear here too.
        </PageIntro>
      </div>

      <div className="space-y-md px-margin-mobile py-md">
        {incoming.length > 0 && (
          <div>
            <SectionTitle>Incoming Requests</SectionTitle>
            <div className="space-y-sm">
              {incoming.map((m) => (
                <Card key={m.id} className="border-primary/40 bg-primary-fixed/30">
                  <p className="font-label-lg text-label-lg text-on-surface">
                    <span className="font-semibold">{inviterName(m.familyGroupId)}</span> wants to link you as family
                  </p>
                  <p className="mt-xs text-label-md text-on-surface-variant">
                    Accepting lets you share their treatment packages.
                  </p>
                  <div className="mt-sm grid grid-cols-2 gap-sm">
                    <Button size="sm" onClick={() => acceptRequest(m.id, m.familyGroupId)}>
                      <Icon name="check" size={16} /> Accept
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => declineRequest(m.id, m.familyGroupId)}>
                      <Icon name="close" size={16} /> Decline
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-sm">
          <Button variant="secondary" onClick={() => { setModal('adult'); setError(null) }}>
            <Icon name="person_add" size={20} /> Link Adult
          </Button>
          <Button variant="secondary" onClick={() => { setModal('child'); setError(null) }}>
            <Icon name="child_care" size={20} /> Add Child
          </Button>
        </div>

        <div>
          <SectionTitle
            action={
              members.length > 0 ? (
                <span className="rounded-full bg-secondary-container px-sm py-xs font-label-md text-label-md text-on-secondary-container">
                  {members.length} Members
                </span>
              ) : undefined
            }
          >
            Family Members
          </SectionTitle>

          {members.length === 0 ? (
            <EmptyState
              icon="groups"
              title="No family members yet"
              subtitle="Link a spouse or add a child to share packages."
            />
          ) : (
            <div className="space-y-sm">
              {members.map((m) => {
                const pending = m.status === 'pending'
                const role = m.isChild ? 'Child' : m.relationship === 'spouse' ? 'Spouse' : 'Family'
                return (
                  <Card key={m.id} className={pending ? 'opacity-80' : undefined}>
                    <div className="flex items-center justify-between gap-sm">
                      <div className="flex min-w-0 items-center gap-sm">
                        <div
                          className={
                            'flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-headline-sm text-headline-sm ' +
                            (m.isChild
                              ? 'bg-secondary-fixed text-on-secondary-fixed'
                              : 'bg-primary-fixed text-on-primary-fixed')
                          }
                        >
                          {initials(m.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-headline-sm text-headline-sm text-on-surface">{m.name}</p>
                          <p className="text-label-md text-on-surface-variant">{role}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-xs">
                        {pending ? (
                          <span className="inline-flex items-center gap-xs rounded-full bg-tertiary-fixed px-sm py-xs font-label-md text-label-md text-on-tertiary-fixed-variant">
                            <Icon name="schedule" size={16} /> Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-xs font-label-lg text-label-lg text-primary">
                            <Icon name="check_circle" size={18} fill /> Active
                          </span>
                        )}
                        <button
                          onClick={() => removeMember(m.id, m.name, m.isChild)}
                          aria-label={`Remove ${m.name}`}
                          className="rounded-full p-xs text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
                        >
                          <Icon name="delete" size={20} />
                        </button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <p className="px-xs text-label-md text-on-surface-variant">
          Linked, active family members can use your treatment packages.
        </p>
      </div>

      <Modal open={modal === 'child'} onClose={() => setModal(null)} title="Add Child">
        {error && <div className="mb-sm"><Banner kind="error">{error}</Banner></div>}
        <Field label="Child's name" hint="Children don't need a separate login.">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Button size="lg" className="mt-md" onClick={submitChild}>Add</Button>
      </Modal>

      <Modal open={modal === 'adult'} onClose={() => setModal(null)} title="Link an Adult Member">
        {error && <div className="mb-sm"><Banner kind="error">{error}</Banner></div>}
        <Field label="Email or mobile number" hint="This person must already be registered and accept the link.">
          <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="email / +971..." />
        </Field>
        <Button size="lg" className="mt-md" onClick={submitAdult}>Send Request</Button>
      </Modal>
    </div>
  )
}
