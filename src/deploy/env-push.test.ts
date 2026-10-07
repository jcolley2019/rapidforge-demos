// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseDotenv } from './env-push'

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
