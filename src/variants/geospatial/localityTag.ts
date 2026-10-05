import { siteContent as site } from '../../brief/current'

const toTag = (s: string) =>
  s.replace(/&/g, 'AND').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').toUpperCase()

/** Readout-style locality line, e.g. "PLUMBING // NAMPA". */
export const LOCALITY_TAG = site.city
  ? `${toTag(site.verticalLabel)} // ${toTag(site.city)}`
  : toTag(site.verticalLabel)
