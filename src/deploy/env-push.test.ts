// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseDotenv, pushPlan } from './env-push'

describe('parseDotenv', () => {
  it('reads keys, skips comments and blanks, strips quotes', () => {
    const env = parseDotenv('# keys\nANTHROPIC_API_KEY=sk-x\n\nRESEND_API_KEY="re_1"\nPICK_TO_EMAIL=\'joey@example.com\'\nPICK_FROM_EMAIL=onboarding@resend.dev\nbroken line\n')
    expect(env).toEqual({
      ANTHROPIC_API_KEY: 'sk-x',
      RESEND_API_KEY: 're_1',
      PICK_TO_EMAIL: 'joey@example.com',
      PICK_FROM_EMAIL: 'onboarding@resend.dev',
    })
  })
})

describe('pushPlan', () => {
  it('pushes the leads Supabase keys, and the email keys only when set', () => {
    const plan = pushPlan({ LEADS_SUPABASE_URL: 'https://x.supabase.co', LEADS_SUPABASE_SERVICE_ROLE_KEY: 'k', RESEND_API_KEY: '', PICK_TO_EMAIL: ' ', PICK_FROM_EMAIL: 'a@b.co' })
    expect(plan).toEqual({
      push: ['LEADS_SUPABASE_URL', 'LEADS_SUPABASE_SERVICE_ROLE_KEY', 'PICK_FROM_EMAIL'],
      skip: ['RESEND_API_KEY', 'PICK_TO_EMAIL'],
      missing: [],
    })
    expect(plan.push.some((k) => k.startsWith('VITE_'))).toBe(false)
  })

  it('reports a missing leads key', () => {
    expect(pushPlan({ LEADS_SUPABASE_URL: 'https://x.supabase.co' }).missing).toEqual(['LEADS_SUPABASE_SERVICE_ROLE_KEY'])
  })
})
