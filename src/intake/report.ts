import type { DesignBrief } from '../brief/design-brief'
import { BRIEF_FIELDS, type BriefKey, type Provenance } from './merge'
import type { PhotoTag } from './vision'

/**
 * What a run found, for people: the console summary table and
 * leads/<slug>/intake-report.md (one line per field, the photo tags, the
 * segment and its reason, the brand colors, and every flag raised).
 */

export interface PhotoRow {
  file: string
  source: string
  tag: PhotoTag
  use: 'photo' | 'crew' | 'stock fallback' | 'unused'
  error?: string
  /** The stock vendor its URL names, when vision was skipped for it. */
  vendor?: string
}

/** The Note cell: why a photo is untagged or stock-by-URL, otherwise what vision saw. */
function photoNote(p: PhotoRow): string {
  if (p.error) return `untagged: ${clip(p.error, 80)}`
  if (p.vendor) return `${p.tag.note} (${p.vendor}); not sent to vision`
  return p.tag.note
}

export interface ReportInput {
  slug: string
  url: string
  brief: DesignBrief
  provenance: Record<BriefKey, Provenance>
  photos: PhotoRow[]
  segmentReason: string
  models: { vision: string | null; text: string | null }
  flags: string[]
}

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/** One short line for a field's value. */
export function preview(key: BriefKey, value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (Array.isArray(value)) {
    if (value.length === 0) return '—'
    return `${value.length}: ${value.map((item) => itemText(key, item)).join(' | ')}`
  }
  if (typeof value === 'object') {
    if (key === 'primary_cta') {
      const cta = value as DesignBrief['primary_cta']
      return `${cta.label} (${cta.kind}) → ${cta.href}`
    }
    if (key === 'current_site') {
      const site = value as NonNullable<DesignBrief['current_site']>
      return `${site.desktop_url} + ${site.mobile_url}`
    }
    if (key === 'source') return (value as DesignBrief['source']).audit_id
    return JSON.stringify(value)
  }
  return String(value)
}

function itemText(key: BriefKey, item: unknown): string {
  if (typeof item === 'string') return item
  const o = item as Record<string, unknown>
  if (key === 'hours') return `${String(o.day).slice(0, 3)} ${o.open && o.close ? `${o.open}–${o.close}` : 'closed'}`
  if (key === 'badges') return o.value ? `${o.label} ${o.value}` : String(o.label)
  return String(o.text ?? o.label ?? o.title ?? JSON.stringify(item))
}

/** The console table: field, status, value. */
export function summaryTable(brief: DesignBrief, provenance: Record<BriefKey, Provenance>): string {
  const rows = BRIEF_FIELDS.map((key) => [key, provenance[key].status, clip(preview(key, brief[key]), 70)])
  const widths = [0, 1].map((col) => Math.max(...rows.map((r) => r[col].length), col === 0 ? 5 : 6))
  const line = (cells: string[]) => `${cells[0].padEnd(widths[0])}  ${cells[1].padEnd(widths[1])}  ${cells[2]}`
  return [line(['field', 'status', 'value']), line(['-'.repeat(widths[0]), '-'.repeat(widths[1]), '-----']), ...rows.map(line)].join('\n')
}

export function intakeReport(input: ReportInput): string {
  const { brief, provenance } = input
  const fieldLines = BRIEF_FIELDS.map((key) => {
    const p = provenance[key]
    return `- **${key}** — ${p.status} (${p.how}): ${clip(preview(key, brief[key]), 160)}`
  })
  const photoLines =
    input.photos.length === 0
      ? ['No photos passed the size filter.']
      : [
          '| File | Kind | Quality | Used as | Note | Source |',
          '| --- | --- | --- | --- | --- | --- |',
          ...input.photos.map(
            (p) =>
              `| ${p.file} | ${p.tag.kind} | ${p.vendor ? '—' : p.tag.quality} | ${p.use} | ${photoNote(p).replace(/\|/g, '/')} | ${p.source} |`,
          ),
        ]
  return [
    `# Intake report — ${brief.business_name}`,
    '',
    `- Lead: \`lead-${input.slug}\``,
    `- Site: ${input.url}`,
    `- Run: ${brief.generated_at}`,
    `- Models: vision ${input.models.vision ?? '(no call succeeded)'}, text ${input.models.text ?? '(call failed, deterministic fallback)'}`,
    '',
    '## Fields',
    '',
    'found = read off the site; inferred = judged by a model or a heuristic; generated = made by intake; lead = from the lead brief; missing = nothing found.',
    '',
    ...fieldLines,
    '',
    '## Photos',
    '',
    ...photoLines,
    '',
    '## Segment',
    '',
    `${brief.segment} — ${input.segmentReason}`,
    '',
    '## Brand colors',
    '',
    brief.brand_colors.length > 0 ? brief.brand_colors.map((c) => `- ${c}`).join('\n') : 'None found.',
    '',
    '## Flags',
    '',
    input.flags.length > 0 ? input.flags.map((f) => `- ${f}`).join('\n') : 'None.',
    '',
  ].join('\n')
}
