import { z } from 'zod'

/**
 * DesignBrief — the contract between the audit pipeline and the demo-site
 * generator. One brief describes one prospect's business; every visual
 * variant renders from the same brief.
 */

const ReviewQuoteSchema = z.object({
  text: z.string(),
  rating: z.number().nullable(),
  author: z.string().optional(),
})

const HoursRowSchema = z.object({
  day: z.string(),
  open: z.string().nullable(),
  close: z.string().nullable(),
})

const PrimaryCtaSchema = z.object({
  label: z.string(),
  kind: z.enum(['booking', 'phone', 'form', 'other']),
  href: z.string(),
})

const SourceSchema = z.object({
  audit_id: z.string(),
  haiku_model: z.string().optional(),
  template_fallback: z.boolean(),
})

export const DesignBriefSchema = z.object({
  business_name: z.string(),
  /** snake_case vertical key, e.g. "plumbing" or "dental_office". */
  vertical: z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/, 'vertical must be snake_case'),
  tone_descriptors: z.array(z.string()).min(3).max(5),
  services: z.array(z.string()).min(1).max(12),
  review_quotes: z.array(ReviewQuoteSchema).max(5),
  photo_urls: z.array(z.string()).max(8),
  hours: z.array(HoursRowSchema).nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  primary_cta: PrimaryCtaSchema,
  current_site_problem: z.string(),
  generated_at: z.string(),
  source: SourceSchema,
})

export type DesignBrief = z.infer<typeof DesignBriefSchema>
