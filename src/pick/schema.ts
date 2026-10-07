import { z } from 'zod'

/**
 * One "I like this one" pick, as the modal posts it to /api/pick. `website`
 * is a honeypot: humans never see the field, so a filled value marks a bot.
 */
export const PickSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  business_name: z.string().trim().min(1).max(200),
  preset_id: z.string().trim().min(1).max(80),
  preset_name: z.string().trim().min(1).max(120),
  variant_slug: z.string().trim().min(1).max(80),
  page_url: z.string().trim().url().max(2000),
  name: z.string().trim().max(200).default(''),
  email: z.string().trim().max(320).default(''),
  phone: z.string().trim().max(60).default(''),
  note: z.string().trim().max(2000).default(''),
  website: z.string().max(2000).default(''),
})

export type Pick = z.infer<typeof PickSchema>

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** True when the pick leaves Joey a way back: an email that looks like one, or a phone with 7+ digits. */
export function reachable(email: string, phone: string): boolean {
  return EMAIL.test(email.trim()) || phone.replace(/\D/g, '').length >= 7
}
