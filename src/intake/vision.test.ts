// @vitest-environment node
import type { CompletionRequest, CompletionResponse } from '@rapidforge/ai-core'
import { describe, expect, it } from 'vitest'
import type { AiClient } from './ai'
import { mapTaggedPhotos, tagPhoto, tagPhotos, type PhotoKind, type PhotoTag } from './vision'

let n = 0
function photo(kind: PhotoKind, quality: number): { id: string; tag: PhotoTag } {
  return { id: `${kind}-${quality}-${n++}`, tag: { kind, quality, note: '' } }
}
const ids = (list: Array<{ id: string }>) => list.map((p) => p.id.replace(/-\d+$/, ''))

describe('mapTaggedPhotos', () => {
  it('puts crew and van shots in crew, building and job shots in photos, best first', () => {
    const plan = mapTaggedPhotos([
      photo('job', 3),
      photo('crew', 2),
      photo('building', 5),
      photo('van', 4),
      photo('job', 4),
      photo('stock', 5),
      photo('logo', 5),
    ])
    expect(ids(plan.crew)).toEqual(['van-4', 'crew-2'])
    expect(ids(plan.photos)).toEqual(['building-5', 'job-4', 'job-3'])
    expect(plan.fallback).toEqual([])
  })

  it('caps crew at 4 and photos at 8, keeping site order on equal quality', () => {
    const plan = mapTaggedPhotos([
      ...Array.from({ length: 6 }, () => photo('crew', 3)),
      ...Array.from({ length: 10 }, (_, i) => photo('job', i % 2 === 0 ? 4 : 2)),
    ])
    expect(plan.crew).toHaveLength(4)
    expect(plan.photos).toHaveLength(8)
    expect(ids(plan.photos)).toEqual(['job-4', 'job-4', 'job-4', 'job-4', 'job-4', 'job-2', 'job-2', 'job-2'])
  })

  it('tops up with the best stock/other only when fewer than 3 real photos exist, and reports it', () => {
    const plan = mapTaggedPhotos([photo('crew', 4), photo('stock', 2), photo('other', 5), photo('stock', 4), photo('logo', 5)])
    expect(ids(plan.crew)).toEqual(['crew-4'])
    expect(ids(plan.fallback)).toEqual(['other-5', 'stock-4'])
    expect(ids(plan.photos)).toEqual(['other-5', 'stock-4'])
  })

  it('uses no stock once three real photos exist, and never a logo', () => {
    const plan = mapTaggedPhotos([photo('crew', 1), photo('van', 1), photo('job', 1), photo('stock', 5), photo('logo', 5)])
    expect(plan.fallback).toEqual([])
    expect(ids(plan.photos)).toEqual(['job-1'])
  })
})

function fakeClient(answer: (req: CompletionRequest) => string | Error): AiClient & { requests: CompletionRequest[] } {
  const requests: CompletionRequest[] = []
  return {
    requests,
    async complete(req): Promise<CompletionResponse> {
      requests.push(req)
      const out = answer(req)
      if (out instanceof Error) throw out
      return { text: out, provider: 'anthropic', model: 'claude-haiku-4-5', finishReason: 'stop' }
    },
  }
}

describe('tagPhoto', () => {
  it('sends the JPEG as an image part on the fast tier with a JSON schema, and clamps the answer', async () => {
    const client = fakeClient(() => JSON.stringify({ kind: 'crew', quality: 7, note: '  Two techs by a van  ' }))
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9])
    const { tag, model } = await tagPhoto(client, jpeg)

    expect(tag).toEqual({ kind: 'crew', quality: 5, note: 'Two techs by a van' })
    expect(model).toBe('claude-haiku-4-5')
    const req = client.requests[0]
    expect(req.provider).toBe('anthropic')
    expect(req.tier).toBe('fast')
    expect(req.model).toBeUndefined()
    expect(req.outputConfig?.format?.type).toBe('json_schema')
    expect(req.outputConfig?.format?.schema).toMatchObject({ required: ['kind', 'quality', 'note'] })
    const user = req.messages.find((m) => m.role === 'user')!
    expect(user.content).toContainEqual({ type: 'image', mediaType: 'image/jpeg', data: jpeg.toString('base64') })
  })

  it('rejects a kind outside the list', async () => {
    const client = fakeClient(() => JSON.stringify({ kind: 'selfie', quality: 3, note: '' }))
    await expect(tagPhoto(client, Buffer.alloc(4))).rejects.toThrow(/schema/)
  })
})

describe('tagPhotos', () => {
  it('marks a failed call as untagged "other" without failing the run', async () => {
    let calls = 0
    const client = fakeClient(() => (calls++ === 0 ? new Error('overloaded') : JSON.stringify({ kind: 'job', quality: 4, note: 'A repipe' })))
    const { tagged, model } = await tagPhotos(client, [{ jpeg: Buffer.alloc(4) }, { jpeg: Buffer.alloc(4) }])
    const failed = tagged.filter((t) => t.error)
    expect(failed).toHaveLength(1)
    expect(failed[0].tag).toEqual({ kind: 'other', quality: 1, note: 'untagged' })
    expect(tagged.filter((t) => !t.error).map((t) => t.tag.kind)).toEqual(['job'])
    expect(model).toBe('claude-haiku-4-5')
  })
})
