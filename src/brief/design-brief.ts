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

const BadgeSchema = z.object({
  label: z.string(),
  kind: z.enum(['bbb', 'license', 'award', 'dealer', 'association', 'rating', 'other']),
  value: z.string().optional(),
})

const StatSchema = z.object({
  label: z.string(),
  value: z.string(),
})

const OfferSchema = z.object({
  title: z.string(),
  detail: z.string(),
  kind: z.enum(['coupon', 'financing', 'special']),
  expires: z.string().optional(),
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
  // RFD.PRESETS.5: optional, defaulted, so every earlier brief still parses.
  /** Towns served, e.g. ["Nampa", "Caldwell"]. */
  service_areas: z.array(z.string()).max(24).default([]),
  badges: z.array(BadgeSchema).max(8).default([]),
  /** Big-number proof, e.g. { label: "Years in business", value: "40+" }. */
  stats: z.array(StatSchema).max(4).default([]),
  offers: z.array(OfferSchema).max(3).default([]),
  founded_year: z.number().int().nullable().default(null),
  license_number: z.string().nullable().default(null),
  /** Owners, crew, branded vans; distinct from photo_urls. */
  crew_photo_urls: z.array(z.string()).max(4).default([]),
  segment: z.enum(['residential', 'commercial', 'new_construction', 'mixed']).default('residential'),
  /** e.g. "24/7 emergency service". */
  hours_note: z.string().nullable().default(null),
})

export type DesignBrief = z.infer<typeof DesignBriefSchema>
