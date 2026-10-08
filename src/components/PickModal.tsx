import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import './PickModal.css'

import type { Preset } from '../presets/presets'
import { reachable } from '../pick/schema'
import { pickTokens } from './pickTokens'

/**
 * "I like this one": the prospect names the look they want and leaves a way
 * to reach them; the pick goes to /api/pick, which saves it to the leads
 * app when the build carries a business id, and emails Joey. One modal
 * serves the floating button on every variant page and the per-card button
 * on the picker. The `website` field is a honeypot no person sees.
 */

export interface PickTarget {
  /** The lead's slug (the brief name without `lead-`), or the fixture stem. */
  slug: string
  businessName: string
  /** The leads app's business id (SiteContent.leadBusinessId); null for fixtures, which then post as before. */
  businessId: string | null
  preset: Preset
  variantSlug: string
}

export interface PickModalProps {
  target: PickTarget
  onClose: () => void
  /** Overrides window.fetch, for tests. */
  post?: typeof fetch
}

type Phase = 'form' | 'sending' | 'sent'

export default function PickModal({ target, onClose, post }: PickModalProps) {
  const { preset, businessName, businessId, variantSlug, slug } = target
  const titleId = useId()
  const baseId = useId()
  const firstField = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>('form')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    firstField.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const field = (k: string) => String(form.get(k) ?? '').trim()
    const email = field('email')
    const phone = field('phone')
    if (!reachable(email, phone)) {
      setError('Add an email or a phone number so Joey can reach you.')
      return
    }
    setError(null)
    setPhase('sending')
    const body = {
      slug,
      business_name: businessName,
      ...(businessId ? { businessId } : {}),
      preset_id: preset.id,
      preset_name: preset.name,
      variant_slug: variantSlug,
      page_url: window.location.href,
      name: field('name'),
      email,
      phone,
      note: field('note'),
      website: String(form.get('website') ?? ''),
    }
    try {
      const res = await (post ?? fetch)('/api/pick', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error || `The pick did not send (HTTP ${res.status}).`)
      }
      setPhase('sent')
    } catch (err) {
      setPhase('form')
      setError(err instanceof Error ? err.message : 'The pick did not send. Try again.')
    }
  }

  return (
    <div className="pick-scrim" style={pickTokens(preset)} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pick-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button type="button" className="pick-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {phase === 'sent' ? (
          <div className="pick-done" role="status">
            <p className="pick-check" aria-hidden="true">
              ✓
            </p>
            <h2 className="pick-title" id={titleId}>
              Got it — we'll be in touch.
            </h2>
            <p className="pick-sub">
              {preset.name} is marked as the one {businessName} likes.
            </p>
            <button type="button" className="pick-send" onClick={onClose}>
              Back to the site
            </button>
          </div>
        ) : (
          <form className="pick-form" onSubmit={submit} noValidate>
            <h2 className="pick-title" id={titleId}>
              You like {preset.name}.
            </h2>
            <p className="pick-sub">Leave a way to reach you and Joey will build it out for {businessName}.</p>

            <label className="pick-label" htmlFor={`${baseId}-name`}>
              Your name
            </label>
            <input ref={firstField} id={`${baseId}-name`} className="pick-input" name="name" type="text" autoComplete="name" />

            <div className="pick-pair">
              <div>
                <label className="pick-label" htmlFor={`${baseId}-email`}>
                  Email
                </label>
                <input id={`${baseId}-email`} className="pick-input" name="email" type="email" autoComplete="email" inputMode="email" />
              </div>
              <div>
                <label className="pick-label" htmlFor={`${baseId}-phone`}>
                  Phone
                </label>
                <input id={`${baseId}-phone`} className="pick-input" name="phone" type="tel" autoComplete="tel" inputMode="tel" />
              </div>
            </div>
            <p className="pick-hint">One of the two is enough.</p>

            <label className="pick-label" htmlFor={`${baseId}-note`}>
              Anything you'd change?
            </label>
            <textarea id={`${baseId}-note`} className="pick-input pick-note" name="note" rows={3} />

            {/* Honeypot: off-screen, out of the tab order, hidden from assistive tech. */}
            <div className="pick-hp" aria-hidden="true">
              <label htmlFor={`${baseId}-website`}>Website</label>
              <input id={`${baseId}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            {error && (
              <p className="pick-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="pick-send" disabled={phase === 'sending'}>
              {phase === 'sending' ? 'Sending…' : 'Send my pick'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
