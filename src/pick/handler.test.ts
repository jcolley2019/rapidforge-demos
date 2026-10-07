// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_FROM, RESEND_URL, handlePick } from './handler'

const ENV = { RESEND_API_KEY: 're_test', PICK_TO_EMAIL: 'joey@example.com' }

const PICK = {
  slug: 'robgoodsonplumbing-com',
  business_name: 'Goodson Plumbing Services',
  preset_id: 'clean-trust',
  preset_name: 'Clean Trust',
  variant_slug: 'heritage',
  page_url: 'https://goodson.demos.rapidforge.ai/heritage',
  name: 'Rob',
  email: 'rob@example.com',
  phone: '',
  note: 'Love the blue.',
  website: '',
}

function post(body: unknown, method = 'POST') {
  return new Request('https://goodson.demos.rapidforge.ai/api/pick', {
    method,
    headers: { 'content-type': 'application/json' },
    body: method === 'GET' ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
}

const resendOk = () => vi.fn(async () => new Response(JSON.stringify({ id: 'em_1' }), { status: 200 }))

describe('POST /api/pick', () => {
  it('405s anything but POST and never calls Resend', async () => {
    const fetch = resendOk()
    const res = await handlePick(post(null, 'GET'), ENV, fetch)
    expect(res.status).toBe(405)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('400s a non-JSON body, a malformed pick, and a pick with no way back', async () => {
    const fetch = resendOk()
    expect((await handlePick(post('not json'), ENV, fetch)).status).toBe(400)
    expect((await handlePick(post({ ...PICK, page_url: 'nope' }), ENV, fetch)).status).toBe(400)
    expect((await handlePick(post({ ...PICK, email: '', phone: '' }), ENV, fetch)).status).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('drops a honeypot hit silently with a 200', async () => {
    const fetch = resendOk()
    const res = await handlePick(post({ ...PICK, website: 'http://spam.example' }), ENV, fetch)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('sends the right Resend payload on the happy path', async () => {
    const fetch = resendOk()
    const res = await handlePick(post(PICK), { ...ENV, PICK_FROM_EMAIL: '' }, fetch)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(RESEND_URL)
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer re_test')
    const body = JSON.parse(init.body as string)
    expect(body.from).toBe(DEFAULT_FROM)
    expect(body.to).toEqual(['joey@example.com'])
    expect(body.reply_to).toBe('rob@example.com')
    expect(body.subject).toBe('[Demo pick] Goodson Plumbing Services likes Clean Trust')
    for (const value of ['robgoodsonplumbing-com', 'Goodson Plumbing Services', 'clean-trust', 'Clean Trust', 'heritage', 'Rob', 'rob@example.com', 'Love the blue.', 'https://goodson.demos.rapidforge.ai/heritage']) {
      expect(body.text).toContain(value)
    }
    expect(body.text).toContain('Site:          https://goodson.demos.rapidforge.ai')
  })

  it('accepts a phone alone and uses the configured from address', async () => {
    const fetch = resendOk()
    const res = await handlePick(post({ ...PICK, email: '', phone: '(208) 555-0100' }), { ...ENV, PICK_FROM_EMAIL: 'picks@rapidforge.ai' }, fetch)
    expect(res.status).toBe(200)
    const body = JSON.parse((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body.from).toBe('picks@rapidforge.ai')
    expect(body.reply_to).toBeUndefined()
  })

  it('502s with Resend’s message when Resend fails, and when email is unconfigured', async () => {
    const failing = vi.fn(async () => new Response(JSON.stringify({ message: 'Invalid `to` address' }), { status: 422 }))
    const res = await handlePick(post(PICK), ENV, failing)
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ ok: false, error: 'Invalid `to` address' })

    const fetch = resendOk()
    const unconfigured = await handlePick(post(PICK), {}, fetch)
    expect(unconfigured.status).toBe(502)
    expect(fetch).not.toHaveBeenCalled()
  })
})
