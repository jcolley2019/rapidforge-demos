// @vitest-environment node
import type { CompletionRequest, CompletionResponse } from '@rapidforge/ai-core'
import { describe, expect, it } from 'vitest'
import type { AiClient } from './ai'
import { FALLBACK_TONE, fallbackProblem, guessSegment, refineWithAi, type RefineInput } from './refine'

const input: RefineInput = {
  businessName: 'Acme Plumbing',
  vertical: 'plumbing',
  websiteUrl: 'https://acme-plumbing.example/',
  serviceCandidates: ['Drain Cleaning', 'Water Heater Repair', 'Where we work'],
  hoursText: 'Mon–Fri 7am–6pm',
  text: 'Residential plumbing for your home. Homeowners trust us.',
  signals: { hasTelLink: true, hasViewport: true, isHttps: true, hasHours: false, hasBooking: false },
  needsProblem: true,
}

const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const good = {
  services: ['Drain Cleaning', 'Water Heater Repair'],
  tone_descriptors: ['dependable', 'friendly', 'local'],
  segment: 'residential',
  segment_reason: 'Every service page speaks to homeowners.',
  current_site_problem: 'The phone number is buried in the footer and there is no way to book online.',
  hours: WEEK.map((day, i) => (i < 5 ? { day, open: '7:00 AM', close: '6:00 PM' } : { day, open: null, close: null })),
}

function client(answer: () => string | Error): AiClient & { requests: CompletionRequest[] } {
  const requests: CompletionRequest[] = []
  return {
    requests,
    async complete(req): Promise<CompletionResponse> {
      requests.push(req)
      const out = answer()
      if (out instanceof Error) throw out
      return { text: out, provider: 'anthropic', model: 'claude-sonnet-5-5', finishReason: 'stop' }
    },
  }
}

describe('refineWithAi', () => {
  it('uses a valid answer as is, through Sonnet 5.5 with a JSON schema', async () => {
    const ai = client(() => JSON.stringify(good))
    const result = await refineWithAi(ai, input)
    expect(result.fallbacks).toEqual([])
    expect(result.model).toBe('claude-sonnet-5-5')
    expect(result.services).toEqual(good.services)
    expect(result.hours?.[0]).toEqual({ day: 'Monday', open: '7:00 AM', close: '6:00 PM' })
    expect(ai.requests[0].model).toBe('claude-sonnet-5-5')
    expect(ai.requests[0].outputConfig?.format?.type).toBe('json_schema')
  })

  it('falls back per field when a field fails validation, and logs it', async () => {
    const logs: string[] = []
    const ai = client(() => JSON.stringify({ ...good, tone_descriptors: ['calm'], hours: [{ day: 'Monday', open: '7', close: '6' }] }))
    const result = await refineWithAi(ai, input, (m) => logs.push(m))
    expect(result.tone_descriptors).toEqual(FALLBACK_TONE)
    expect(result.hours).toBeNull()
    expect(result.services).toEqual(good.services)
    expect(result.fallbacks.map((f) => f.field)).toEqual(['tone_descriptors', 'hours'])
    expect(logs).toHaveLength(2)
  })

  it('falls back on every field when the call fails', async () => {
    const logs: string[] = []
    const result = await refineWithAi(client(() => new Error('overloaded')), input, (m) => logs.push(m))
    expect(result.model).toBeNull()
    expect(result.services).toEqual(['Drain Cleaning', 'Water Heater Repair'])
    expect(result.segment).toBe('residential')
    expect(result.current_site_problem).toBe('Current site does not list business hours and offers no online booking.')
    expect(logs[0]).toMatch(/call failed/)
  })

  it('leaves current_site_problem null when the lead brief has one', async () => {
    const result = await refineWithAi(client(() => JSON.stringify(good)), { ...input, needsProblem: false })
    expect(result.current_site_problem).toBeNull()
  })
})

describe('deterministic fallbacks', () => {
  it('guesses the segment from word counts', () => {
    expect(guessSegment('Commercial plumbing for restaurants and facilities.').segment).toBe('commercial')
    expect(guessSegment('Homeowners and commercial property managers, residential and commercial.').segment).toBe('mixed')
    expect(guessSegment('New construction rough-in for builders.').segment).toBe('new_construction')
    expect(guessSegment('Plumbing.').segment).toBe('residential')
  })

  it('names what the signals show is missing', () => {
    const none = { hasTelLink: false, hasViewport: false, isHttps: false, hasHours: false, hasBooking: false }
    expect(fallbackProblem(none)).toBe('Current site does not resize for phones, has no tap-to-call phone link and does not list business hours.')
  })
})
