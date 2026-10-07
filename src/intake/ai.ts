import {
  DEFAULT_TIER_MODELS,
  OutputParseError,
  createRouter,
  loadEnv,
  stripJsonFences,
  type CompletionRequest,
  type CompletionResponse,
  type JsonSchemaFormat,
} from '@rapidforge/ai-core'
// zod/v4 (shipped inside this app's zod 3.25) for the wire schemas: it has
// toJSONSchema, which the v3 API the DesignBrief uses does not.
import { z } from 'zod/v4'

/**
 * The one ai-core surface intake calls. ai-core's AIRouter satisfies it;
 * tests inject a fake, so no test touches the network or a model.
 */
export interface AiClient {
  complete(request: CompletionRequest): Promise<CompletionResponse>
}

/** Photo tagging runs on ai-core's cheapest tier: Haiku 4.5 for Anthropic, which reads images. */
export const VISION_TIER = 'fast' as const
export const VISION_MODEL = DEFAULT_TIER_MODELS.anthropic[VISION_TIER]
/** Text extraction. */
export const TEXT_MODEL = 'claude-sonnet-5-5'

/**
 * An ai-core client for the Anthropic key in .env. ai-core's loadEnv reads
 * .env with dotenv and validates it; the router retries 429s and 5xx.
 */
export function createAiClient(): AiClient {
  const env = loadEnv()
  if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set (expected in .env)')
  return createRouter({ defaultProvider: 'anthropic', maxRetries: 2 })
}

/**
 * outputConfig.format for a schema. Same JSON Schema ai-core's
 * jsonSchemaFormat builds, but from this app's zod: ai-core's helper is
 * typed against its own nested zod 4.6, whose types do not unify with ours.
 */
export function formatFor(schema: z.ZodType, name: string): JsonSchemaFormat {
  const body: Record<string, unknown> = { ...z.toJSONSchema(schema) }
  delete body.$schema
  return { type: 'json_schema', schema: body, name }
}

/**
 * ai-core's parseJson, validated with this app's zod: the same checks in
 * the same order, failing with the same OutputParseError reasons.
 */
export function parseStructured<T>(response: CompletionResponse, schema: z.ZodType<T>): T {
  if (response.finishReason === 'length') {
    throw new OutputParseError('truncated', 'completion was cut off (finishReason length); raise maxTokens')
  }
  if (response.finishReason === 'content_filter') {
    throw new OutputParseError(
      'refused',
      'provider declined the request (finishReason content_filter)',
      response.stopDetails ? { stopDetails: response.stopDetails } : undefined,
    )
  }
  const text = stripJsonFences(response.text)
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch (error) {
    const textPreview = text.slice(0, 200)
    throw new OutputParseError('invalid_json', `completion text is not valid JSON: ${JSON.stringify(textPreview)}`, {
      cause: error,
      textPreview,
    })
  }
  const result = schema.safeParse(value)
  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({ path: issue.path, message: issue.message }))
    throw new OutputParseError(
      'schema_mismatch',
      `completion JSON does not match the schema: ${issues.map((i) => `${i.path.join('.') || '(root)'} ${i.message}`).join('; ')}`,
      { cause: result.error, issues },
    )
  }
  return result.data
}

/** A short, single-line description of any error, for logs and the intake report. */
export function describeError(error: unknown): string {
  if (error instanceof OutputParseError) return `${error.reason}: ${error.message}`
  return error instanceof Error ? error.message : String(error)
}
