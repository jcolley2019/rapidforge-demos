// Vault capture (RFD.VAULT.4): screenshots and DOM facts from real local
// trade sites, the raw material for the per-vertical taste vault.
//
// Reads the primary picks in scripts/vault-sites.json. For each site it
// checks robots.txt first (RFC 9309: rules for our RapidForgeVault token,
// else "*"; a disallowed homepage or an unreachable robots.txt skips the
// site), then loads the homepage in Chromium twice and writes to
// vaults/raw/<vertical>/<slug>/:
//
//   desktop 1440x900  desktop.png (full page), desktop-fold.jpg (first viewport)
//   mobile  390x844   mobile.png (full page)
//   facts.json        final URL, <title>, meta description, every H1/H2,
//                     tel: hrefs, CTA button labels, body/h1 font-family, the
//                     6 most common background and text colours, sticky
//                     header, phone number in the first 390px viewport,
//                     images above the fold, LCP and performance.timing,
//                     plus text/vendor signals the distill step counts.
//
// Every page load has a 30 s timeout. A failed or blocked site is logged to
// vaults/raw/capture-log.json and skipped. Sites already captured are kept
// unless --force. Exit code 1 when fewer than 30 of 36 picks are captured.
//
//   node scripts/vault-capture.mjs [--force] [--only <vertical|slug>]

import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const option = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const SITES = resolve(root, option('--sites') ?? 'scripts/vault-sites.json')
const OUT = resolve(root, option('--out') ?? 'vaults/raw')
const ONLY = option('--only')
const FORCE = args.includes('--force')

const NAV_TIMEOUT = 30_000
const CONCURRENCY = 3
const TOKEN = 'RapidForgeVault'
const DESKTOP = { width: 1440, height: 900 }
const MOBILE = { width: 390, height: 844 }
const MAX_HEIGHT = { desktop: 16_000, mobile: 24_000 }
const BLOCKED = /just a moment|attention required|access denied|forbidden|captcha|security check|are you (a )?human|pardon our interruption|request rejected/i

// Scroll-reveal libraries leave sections at opacity 0 until they scroll into
// view; the page is scrolled once before the full-page shot, and this
// un-hides whatever is still waiting.
const REVEAL_CSS = `
[data-aos], .wow, .elementor-invisible, [data-sal], .et-waypoint, .et_pb_animation_top,
.et_pb_animation_bottom, .et_pb_animation_left, .et_pb_animation_right, .fusion-animated,
[data-scroll-reveal], .sr-only-reveal {
  opacity: 1 !important; visibility: visible !important; transform: none !important;
  animation: none !important; transition: none !important;
}`

// Runs in every document before the site's own scripts (Playwright init
// script, so it must be self-contained). Installs window.__vault: an LCP
// observer plus the probes the capture calls with page.evaluate.
function vaultInit() {
  if (window.__vault) return
  const PHONE = /(?:\+?1[\s.-]?)?\(?\b[2-9]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/
  const LICENSE =
    /\b(?:lic(?:ense)?|licence|reg(?:istration)?|roc|ccb|rce|contractor)\.?\s*(?:no\.?|number|#)?\s*[:#]?\s*[a-z]{0,4}[-\s]?\d[\d-]{3,}\b/i
  const vault = (window.__vault = { lcp: null, lcpTag: null, bg: {} })
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        vault.lcp = Math.round(e.startTime)
        vault.lcpTag = e.element ? e.element.tagName.toLowerCase() : null
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  } catch {
    /* no LCP support in this document */
  }

  let ctx = null
  // Any CSS colour -> { hex, a } via canvas normalisation; null if unparseable.
  const color = (value) => {
    if (!value || value === 'transparent') return null
    ctx ??= document.createElement('canvas').getContext('2d')
    ctx.fillStyle = '#010203'
    ctx.fillStyle = value
    const v = ctx.fillStyle
    if (v === '#010203' && !/^#010203$/i.test(value)) return null
    if (v.startsWith('#')) return { hex: v.toLowerCase(), a: 1 }
    const m = v.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/)
    if (!m) return null
    const hex = '#' + [m[1], m[2], m[3]].map((n) => Math.round(Number(n)).toString(16).padStart(2, '0')).join('')
    return { hex, a: m[4] === undefined ? 1 : Number(m[4]) }
  }
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim()
  const shown = (el) => {
    if (!el || !el.getBoundingClientRect) return false
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }
  const onScreen = (r) => r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth
  const inside = (r) => r.top >= -2 && r.bottom <= innerHeight + 2 && r.left >= -2 && r.right <= innerWidth + 2
  const unobstructed = (el, r) => {
    const x = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1)
    const y = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1)
    const hit = document.elementFromPoint(x, y)
    return !!hit && (hit === el || el.contains(hit) || hit.contains(el))
  }
  const bgOf = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const c = color(getComputedStyle(n).backgroundColor)
      if (c && c.a > 0.5) return c.hex
    }
    return '#ffffff'
  }

  // Phone number (or call link) fully inside the current viewport and not
  // covered by another element.
  vault.phoneInView = () => {
    let numberVisible = false
    let callLinkVisible = false
    let text = null
    for (const a of document.querySelectorAll('a[href^="tel:" i]')) {
      if (!shown(a)) continue
      const r = a.getBoundingClientRect()
      if (!inside(r) || !unobstructed(a, r)) continue
      callLinkVisible = true
      const m = clean(a.innerText).match(PHONE)
      if (m) {
        numberVisible = true
        text ??= m[0]
      }
    }
    if (!numberVisible) {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const m = n.nodeValue && n.nodeValue.match(PHONE)
        if (!m || !shown(n.parentElement)) continue
        const range = document.createRange()
        range.selectNodeContents(n)
        const r = range.getBoundingClientRect()
        if (r.width === 0 || !inside(r) || !unobstructed(n.parentElement, r)) continue
        numberVisible = true
        text = m[0]
        break
      }
    }
    return { numberVisible, callLinkVisible, text }
  }

  vault.foldImages = () => {
    let img = 0
    let bgImage = 0
    let video = 0
    for (const el of document.querySelectorAll('body *')) {
      const tag = el.tagName
      if (tag === 'IMG' || tag === 'VIDEO') {
        if (!shown(el)) continue
        const r = el.getBoundingClientRect()
        if (r.width < 32 || r.height < 32 || !onScreen(r)) continue
        if (tag === 'IMG') img++
        else video++
        continue
      }
      const bi = getComputedStyle(el).backgroundImage
      if (!bi || !bi.includes('url(') || !shown(el)) continue
      const r = el.getBoundingClientRect()
      if (r.width < 100 || r.height < 100 || !onScreen(r)) continue
      bgImage++
    }
    return { img, bgImage, video, total: img + bgImage + video }
  }

  // Button-like links and buttons: filled (background differs from what is
  // behind it), outlined, or carrying a btn/button/cta class.
  const SKIP =
    /^(prev(ious)?|next|close|menu|search|toggle( navigation)?|skip to (main )?content|open menu|close menu|go to slide \d+|slide \d+|\d+|[×✕x☰<>‹›«»]|accept( all)?( cookies)?|decline|reject( all)?|preferences|cookie settings|manage (cookies|preferences)|got it!?|ok(ay)?)$/i
  const ACCEPT = /^(accept( all)?( cookies)?|i accept|got it!?|ok(ay)?|agree|i agree|allow( all)?( cookies)?|dismiss)$/i
  const CLOSE = /^(close( this)?( (cookie|consent|privacy))?( banner| notice| message)?|×|✕|x)$/i

  // Clicks the accept (else close) button of a cookie/consent banner, if one
  // is showing, so it neither covers the screenshots nor counts as a CTA.
  vault.dismissConsent = () => {
    const buttons = [...document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]')]
    for (const pattern of [ACCEPT, CLOSE]) {
      for (const el of buttons) {
        const label = clean(el.tagName === 'INPUT' ? el.value : el.innerText || el.getAttribute('aria-label'))
        if (!pattern.test(label) || !shown(el)) continue
        let box = el
        for (let i = 0; i < 6 && box.parentElement; i++) box = box.parentElement
        if (!/cookie|consent|gdpr|tracking technolog/i.test(box.innerText || '')) continue
        el.click()
        return label
      }
    }
    return null
  }

  // Theme scroll animations that never fired leave whole sections at
  // opacity 0 (or visibility hidden) even after the scroll pass. In-flow
  // blocks with real content are shown; sliders, menus, modals, tabs and
  // anything inside a positioned layer are left alone.
  const NO_REVEAL =
    /slick|swiper|carousel|slider|owl-|splide|glide|flickity|modal|popup|lightbox|dropdown|sub-menu|submenu|mega|offcanvas|off-canvas|drawer|tab-pane|accordion|tooltip|mobile-menu/i
  vault.revealStuck = () => {
    let revealed = 0
    for (const el of document.querySelectorAll('body *')) {
      const s = getComputedStyle(el)
      if (!(Number(s.opacity) < 0.05 || s.visibility === 'hidden')) continue
      if (s.display === 'none' || (s.position !== 'static' && s.position !== 'relative')) continue
      if (el.closest('[aria-hidden="true"], [hidden]')) continue
      let skip = false
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        const cls = typeof n.className === 'string' ? n.className : ''
        if (NO_REVEAL.test(cls) || NO_REVEAL.test(n.id || '')) skip = true
        else if (n !== el && /^(fixed|absolute)$/.test(getComputedStyle(n).position)) skip = true
        if (skip) break
      }
      const r = el.getBoundingClientRect()
      if (skip || r.width * r.height < 2000) continue
      if ((el.textContent || '').trim().length < 10 && !el.querySelector('img, picture, video, svg')) continue
      for (const [prop, value] of [['opacity', '1'], ['visibility', 'visible'], ['transform', 'none'], ['animation', 'none'], ['transition', 'none']]) {
        el.style.setProperty(prop, value, 'important')
      }
      revealed++
    }
    return revealed
  }
  vault.ctas = () => {
    const out = []
    for (const el of document.querySelectorAll('a, button, [role="button"], input[type="submit"], input[type="button"]')) {
      if (!shown(el)) continue
      const r = el.getBoundingClientRect()
      if (r.width < 40 || r.height < 20 || r.width > 640) continue
      const label = clean(el.tagName === 'INPUT' ? el.value : el.innerText || el.getAttribute('aria-label'))
      if (!label || label.length > 48 || SKIP.test(label)) continue
      const s = getComputedStyle(el)
      const own = color(s.backgroundColor)
      const behind = el.parentElement ? bgOf(el.parentElement) : '#ffffff'
      const padX = parseFloat(s.paddingLeft) + parseFloat(s.paddingRight)
      const filled = !!own && own.a > 0.5 && own.hex !== behind && padX >= 12
      const outlined =
        parseFloat(s.borderTopWidth) >= 1 && s.borderTopStyle !== 'none' && parseFloat(s.borderBottomWidth) >= 1 && padX >= 16
      const cls = typeof el.className === 'string' ? el.className : ''
      const named = /\b(btn|button|cta)\b|btn-|button-|-btn|-button|_btn|_button/i.test(cls)
      if (!filled && !outlined && !named) continue
      out.push({
        label,
        y: Math.round(r.top + scrollY),
        inFold: r.top < innerHeight && r.bottom > 0,
        tel: /^tel:/i.test(el.getAttribute('href') || ''),
      })
    }
    return out
  }

  vault.foldSummary = () => ({
    images: vault.foldImages(),
    phone: vault.phoneInView(),
    ctas: vault.ctas().filter((c) => c.inFold).map((c) => c.label),
    h1: [...document.querySelectorAll('h1')].filter(shown).map((h) => clean(h.innerText)).find(Boolean) ?? null,
  })

  // Visible background at a grid of points in the current viewport: the
  // first ancestor with an opaque colour, or "image"/"gradient".
  vault.sampleColors = () => {
    const cols = 24
    const rows = 14
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = Math.round(((i + 0.5) * innerWidth) / cols)
        const y = Math.round(((j + 0.5) * innerHeight) / rows)
        let found = null
        for (let n = document.elementFromPoint(x, y); n && n.nodeType === 1; n = n.parentElement) {
          if (/^(IMG|VIDEO|CANVAS|IFRAME|PICTURE)$/.test(n.tagName)) {
            found = 'image'
            break
          }
          const s = getComputedStyle(n)
          if (s.backgroundImage && s.backgroundImage !== 'none') {
            found = s.backgroundImage.includes('url(') ? 'image' : 'gradient'
            break
          }
          const c = color(s.backgroundColor)
          if (c && c.a > 0.5) {
            found = c.hex
            break
          }
        }
        if (!found) {
          const c = color(getComputedStyle(document.documentElement).backgroundColor)
          found = c && c.a > 0.5 ? c.hex : '#ffffff'
        }
        vault.bg[found] = (vault.bg[found] || 0) + 1
      }
    }
  }

  vault.textColors = () => {
    const weights = {}
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let seen = 0
    for (let n = walker.nextNode(); n && seen < 30000; n = walker.nextNode()) {
      const t = n.nodeValue.trim()
      const el = n.parentElement
      if (t.length < 2 || !el || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|OPTION)$/.test(el.tagName)) continue
      if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue
      const c = color(getComputedStyle(el).color)
      if (!c) continue
      weights[c.hex] = (weights[c.hex] || 0) + t.length
      seen++
    }
    return weights
  }

  // Fixed/sticky elements pinned to the top or bottom of the viewport after
  // scrolling: a sticky header bar, and whether any pinned element carries a
  // phone number or call link.
  vault.sticky = () => {
    const result = { header: false, headerHeight: null, phone: false, bars: [] }
    for (const el of document.querySelectorAll('body *')) {
      const s = getComputedStyle(el)
      if (s.position !== 'fixed' && s.position !== 'sticky') continue
      if (!shown(el)) continue
      const r = el.getBoundingClientRect()
      if (r.width < 40 || r.height < 16 || !onScreen(r)) continue
      const top = r.top <= 12
      const bottom = r.bottom >= innerHeight - 140
      if (!top && !bottom) continue
      const text = clean(el.innerText).slice(0, 400)
      const phone = /^tel:/i.test(el.getAttribute('href') || '') || !!el.querySelector('a[href^="tel:" i]') || PHONE.test(text)
      if (top && r.width >= innerWidth * 0.6 && r.height <= innerHeight * 0.35) {
        result.header = true
        result.headerHeight = Math.max(result.headerHeight || 0, Math.round(r.height))
      }
      if (phone) result.phone = true
      if (result.bars.length < 8) {
        result.bars.push({
          edge: top ? 'top' : 'bottom',
          width: Math.round(r.width),
          height: Math.round(r.height),
          phone,
          text: text.slice(0, 80),
        })
      }
    }
    return result
  }

  // One pass down the page: wakes lazy images and scroll reveals, samples
  // background colours at every step, checks pinned bars once past 1.2
  // viewports.
  vault.scrollThrough = async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const step = Math.max(200, Math.round(innerHeight * 0.8))
    let sticky = null
    let y = 0
    let steps = 0
    for (; steps < 60; steps++) {
      window.scrollTo({ top: y, behavior: 'instant' })
      await sleep(160)
      vault.sampleColors()
      if (!sticky && y >= innerHeight * 1.2) {
        await sleep(400)
        sticky = vault.sticky()
      }
      const max = Math.max(0, document.documentElement.scrollHeight - innerHeight)
      if (y >= max) break
      y = Math.min(y + step, max)
    }
    sticky ??= vault.sticky()
    window.scrollTo({ top: 0, behavior: 'instant' })
    return { sticky, steps: steps + 1 }
  }

  const TRUST = [
    ['licensed', /\blicensed\b/],
    ['insured', /\binsured\b/],
    ['bonded', /\bbonded\b/],
    ['bbb', /\bbbb\b|better business bureau/],
    ['family-owned', /family[- ](owned|operated)/],
    ['locally-owned', /locally[- ]owned|local(ly)?[- ]operated/],
    ['veteran-owned', /veteran[- ]owned/],
    ['warranty', /\bwarrant(y|ies)\b/],
    ['guarantee', /\bguarantee[sd]?\b/],
    ['certified', /\bcertified\b/],
    ['master-license', /master (plumber|electrician)/],
    ['years-in-business', /\b\d{2,3}\+? years\b|since (19|20)\d{2}/],
    ['star-rating', /\b[45](\.\d)?\s?(-|\s)?stars?\b|★★★★|five[- ]star/],
    ['google-reviews', /google reviews?/],
    ['upfront-pricing', /up[- ]?front pricing|flat[- ]rate|no hidden fees/],
    ['background-checked', /background[- ]check(ed)?|drug[- ]tested/],
  ]
  const VENDORS = {
    reviews: ['elfsight', 'trustindex', 'birdeye', 'nicejob', 'reviewsonmywebsite', 'grade.us', 'embedsocial', 'trustpilot',
      'sociablekit', 'reviewbuilder', 'gatherup', 'brightlocal', 'reviews.io', 'shopperapproved', 'guildquality', 'widewail'],
    schedulers: ['servicetitan', 'housecallpro', 'getjobber', 'clienthub', 'scheduleengine', 'calendly', 'acuityscheduling',
      'setmore', 'fieldedge', 'servicefusion', 'workiz', 'servicemonster', 'jobnimbus'],
    chat: ['podium', 'livechatinc', 'tawk.to', 'drift.com', 'intercom', 'leadconnector', 'msgsndr', 'apexchat', 'ngage',
      'smith.ai', 'tidio', 'chatra', 'olark', 'broadly', 'signpost', 'birdeye'],
  }
  const BADGES = ['bbb', 'angi', 'homeadvisor', 'google', 'yelp', 'nate', 'energy star', 'carrier', 'trane', 'lennox', 'rheem',
    'ruud', 'goodman', 'bryant', 'daikin', 'mitsubishi', 'american standard', 'bradford white', 'kohler', 'generac', 'navien',
    'rinnai', 'veteran', 'award', 'best of', 'top rated', 'super service', 'nextdoor', 'phcc', 'neca', 'ibew', 'acca']
  const PLATFORMS = [
    ['wordpress', /wp-content|wp-includes/],
    ['wix', /wixstatic|wix\.com/],
    ['squarespace', /squarespace/],
    ['duda', /multiscreensite|cdn-website\.com|dudamobile/],
    ['webflow', /webflow/],
    ['godaddy', /img1\.wsimg\.com|godaddy/],
    ['hubspot', /hs-sites|hubspot/],
    ['shopify', /cdn\.shopify/],
  ]

  vault.pageFacts = () => {
    const html = document.documentElement.outerHTML.toLowerCase()
    const text = document.body.innerText || ''
    const lower = text.toLowerCase()
    const heads = (sel) =>
      [...document.querySelectorAll(sel)].map((h) => clean(h.innerText || h.textContent)).filter(Boolean).slice(0, 60).map((t) => t.slice(0, 200))
    const tel = [...document.querySelectorAll('a[href^="tel:" i]')].map((a) => a.getAttribute('href').trim())
    const firstShown = (sel) => [...document.querySelectorAll(sel)].find(shown) || document.querySelector(sel)
    const fontOf = (sel) => {
      const el = firstShown(sel)
      return el ? getComputedStyle(el).fontFamily : null
    }
    const loaded = new Set()
    for (const f of document.fonts) if (f.status === 'loaded') loaded.add(f.family.replace(/^["']|["']$/g, ''))
    const vendors = (list) => list.filter((v) => html.includes(v))
    const badgeText = [...document.images].map((i) => `${i.alt} ${i.currentSrc || i.src}`.toLowerCase()).join(' ')
    const credit = text.match(/(?:website|site|web design|designed|powered|marketing) by:?\s+([A-Z][\w&.'\- ]{2,40})/)
    return {
      title: document.title,
      metaDescription: document.querySelector('meta[name="description" i]')?.content ?? null,
      h1: heads('h1'),
      h2: heads('h2'),
      telHrefs: [...new Set(tel)],
      telLinkCount: tel.length,
      ctas: vault.ctas(),
      fonts: {
        body: getComputedStyle(document.body).fontFamily,
        h1: fontOf('h1'),
        h2: fontOf('h2'),
        loaded: [...loaded].slice(0, 20),
      },
      textColors: vault.textColors(),
      signals: {
        trust: TRUST.filter(([, re]) => re.test(lower)).map(([k]) => k),
        coupon: /\bcoupons?\b|\$\s?\d+\s?off\b|\d+%\s?off\b|special offers?\b|\bspecials\b/.test(lower),
        financing: /\bfinanc(ing|e options?)\b|\bmonthly payments?\b|\b0% apr\b|\bsynchrony\b|\bgreensky\b|\bwells fargo\b/.test(lower),
        membership: /\bmaintenance (plan|agreement|club)\b|\bmembership\b|\bservice (plan|agreement)s?\b|\bcomfort club\b/.test(lower),
        serviceArea: /\bservice areas?\b|\bareas (we )?serve[d]?\b|\bproudly serving\b|\bareas? served\b/.test(lower),
        emergency: /\b24\/7\b|\b24 hours?\b|\bemergency\b/.test(lower),
        sameDay: /\bsame[- ]day\b/.test(lower),
        licenseNumber: (text.match(LICENSE) || [null])[0],
        leadForms: [...document.querySelectorAll('form')].filter(
          (f) => shown(f) && f.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), textarea, select').length >= 2,
        ).length,
        reviewVendors: vendors(VENDORS.reviews),
        schedulerVendors: vendors(VENDORS.schedulers),
        chatVendors: vendors(VENDORS.chat),
        badges: BADGES.filter((b) => badgeText.includes(b)),
        platform: PLATFORMS.filter(([, re]) => re.test(html)).map(([k]) => k),
        generator: document.querySelector('meta[name="generator" i]')?.content ?? null,
        credit: credit ? clean(credit[1]) : null,
      },
      height: document.documentElement.scrollHeight,
    }
  }
}

const TIMING = () => {
  const t = performance.timing
  const at = (x) => (x > 0 ? x - t.navigationStart : null)
  return { ttfb: at(t.responseStart), domContentLoaded: at(t.domContentLoadedEventEnd), load: at(t.loadEventEnd) }
}

// RFC 9309 matching: groups for our token (else "*"), longest matching
// pattern wins, Allow wins a tie, "*" wildcard and "$" anchor supported.
function robotsAllows(body, path) {
  const groups = []
  let group = null
  let inAgents = false
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim()
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/)
    if (!m) continue
    const key = m[1].toLowerCase()
    const value = m[2].trim()
    if (key === 'user-agent') {
      if (!group || !inAgents) groups.push((group = { agents: [], rules: [] }))
      group.agents.push(value.toLowerCase())
      inAgents = true
    } else if (key === 'allow' || key === 'disallow') {
      if (group && value) group.rules.push({ allow: key === 'allow', pattern: value })
      inAgents = false
    }
  }
  const mine = groups.filter((g) => g.agents.includes(TOKEN.toLowerCase()))
  const rules = (mine.length ? mine : groups.filter((g) => g.agents.includes('*'))).flatMap((g) => g.rules)
  let best = null
  for (const rule of rules) {
    const anchored = rule.pattern.endsWith('$')
    const source = (anchored ? rule.pattern.slice(0, -1) : rule.pattern)
      .split('*')
      .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*')
    if (!new RegExp(`^${source}${anchored ? '$' : ''}`).test(path)) continue
    const better =
      !best || rule.pattern.length > best.pattern.length || (rule.pattern.length === best.pattern.length && rule.allow)
    if (better) best = rule
  }
  return { allowed: !best || best.allow, rule: best ? `${best.allow ? 'Allow' : 'Disallow'}: ${best.pattern}` : null }
}

// Fetches robots.txt through the browser (same TLS and redirects as the page
// itself). 4xx = no rules; 5xx or unreachable = disallow (RFC 9309 2.3.1).
async function checkRobots(page, url) {
  const u = new URL(url)
  const robotsUrl = `${u.origin}/robots.txt`
  let res
  try {
    res = await page.goto(robotsUrl, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT })
  } catch (err) {
    return { allowed: false, reason: `robots.txt unreachable (${firstLine(err)})` }
  }
  const status = res ? res.status() : 0
  if (status >= 500 || status === 0) return { allowed: false, reason: `robots.txt HTTP ${status}` }
  if (status >= 400) return { allowed: true, reason: `robots.txt HTTP ${status}: no rules` }
  const verdict = robotsAllows(await res.text(), u.pathname + u.search)
  return { allowed: verdict.allowed, reason: verdict.rule ?? 'no matching rule' }
}

const firstLine = (err) => String(err && err.message ? err.message : err).split('\n')[0].slice(0, 160)

async function visit(page, url) {
  const started = Date.now()
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT })
  const left = () => Math.max(500, NAV_TIMEOUT - (Date.now() - started))
  await page.waitForLoadState('load', { timeout: left() }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: Math.min(4000, left()) }).catch(() => {})
  const status = res ? res.status() : 0
  if (status >= 400) throw new Error(`HTTP ${status}`)
  await page
    .evaluate(() => Promise.race([document.fonts ? document.fonts.ready : null, new Promise((r) => setTimeout(r, 4000))]))
    .catch(() => {})
  await page.waitForTimeout(1200)
  const title = await page.title()
  const text = await page.evaluate(() => (document.body ? document.body.innerText : '').slice(0, 3000))
  if (BLOCKED.test(title) || (text.length < 400 && /cloudflare|captcha|verify you are human|access denied/i.test(text))) {
    throw new Error(`blocked: ${(title || text).slice(0, 80)}`)
  }
  // Preloaders: wait (up to 6 s) until no full-screen fixed layer sits over
  // the middle of the viewport.
  await page
    .waitForFunction(
      () => {
        for (let n = document.elementFromPoint(innerWidth / 2, innerHeight / 2); n && n.nodeType === 1; n = n.parentElement) {
          const r = n.getBoundingClientRect()
          if (getComputedStyle(n).position === 'fixed' && r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.9) return false
        }
        return true
      },
      null,
      { timeout: 6000, polling: 250 },
    )
    .catch(() => {})
  const consent = await page.evaluate(() => window.__vault.dismissConsent()).catch(() => null)
  if (consent) await page.waitForTimeout(500)
  return { status, finalUrl: page.url(), loadMs: Date.now() - started, consent }
}

// After the scroll pass: lets lazy widgets the pass woke up (review iframes,
// maps) finish loading, then un-hides reveal blocks that never fired (library
// classes via REVEAL_CSS, the rest via revealStuck) so the page facts and the
// screenshots see what a scrolling visitor sees.
async function afterScroll(page) {
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(1000)
  await page.addStyleTag({ content: REVEAL_CSS }).catch(() => {})
  const revealed = await page.evaluate(() => window.__vault.revealStuck()).catch(() => 0)
  await page.waitForTimeout(400)
  return revealed
}

// Back to the top, then the optional first-viewport JPEG and the full-page PNG.
async function fullShot(page, path, width, cap, foldPath) {
  if (await page.evaluate(() => window.__vault.dismissConsent()).catch(() => null)) await page.waitForTimeout(400) // late banners
  await page.keyboard.press('Escape').catch(() => {})
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(600)
  if (foldPath) await page.screenshot({ path: foldPath, type: 'jpeg', quality: 80, animations: 'disabled' })
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  const clip = height > cap ? { clip: { x: 0, y: 0, width, height: cap } } : {}
  await page.screenshot({ path, fullPage: true, animations: 'disabled', ...clip })
  const patched = await patchIframes(page, path, Math.min(height, cap))
  return { height, truncated: height > cap, patchedIframes: patched }
}

// Full-page captures paint cross-origin iframes (embedded review widgets,
// maps) blank outside the first viewport. Each sizeable in-flow one is
// re-shot from the live viewport, with pinned bars hidden so they cannot
// overlap it, and pasted into the full-page PNG where the PNG has it (the
// top-of-page layout; once scrolled, a header that turns fixed can shift
// the live position, so slices are clipped from the live rect).
async function patchIframes(page, path, cap) {
  const frames = await page.evaluate((cap) => {
    const out = []
    for (const f of document.querySelectorAll('iframe')) {
      const r = f.getBoundingClientRect()
      if (r.width < 200 || r.height < 120) continue
      if (f.checkVisibility && !f.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue
      let pinned = false
      for (let n = f.parentElement; n && n !== document.body && !pinned; n = n.parentElement) pinned = /^(fixed|sticky)$/.test(getComputedStyle(n).position)
      let origin = ''
      try {
        origin = new URL(f.src, location.href).origin
      } catch {
        /* no usable src */
      }
      const top = Math.round(r.top + scrollY)
      if (pinned || !/^https?:/.test(origin) || origin === location.origin || top >= cap || out.length >= 6) continue
      const x = Math.max(0, Math.round(r.left))
      f.setAttribute('data-vault-frame', String(out.length))
      out.push({ id: out.length, x, y: top, width: Math.round(Math.min(r.right, innerWidth)) - x, height: Math.round(Math.min(r.height, cap - top)) })
    }
    return out
  }, cap)
  if (!frames.length) return 0
  await page.addStyleTag({ content: '[data-vault-pinned] { visibility: hidden !important; }' }).catch(() => {})
  // Headers often turn fixed only once scrolled, so pinned bars are marked
  // again after every scroll.
  const markPinned = () => {
    for (const el of document.querySelectorAll('body *')) if (/^(fixed|sticky)$/.test(getComputedStyle(el).position)) el.setAttribute('data-vault-pinned', '')
  }
  const liveTop = ({ id, done }) => document.querySelector(`[data-vault-frame="${id}"]`).getBoundingClientRect().top + done
  const vh = await page.evaluate(() => innerHeight)
  const patches = []
  for (const f of frames) {
    for (let done = 0; done < f.height; ) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), f.y + done)
      await page.waitForTimeout(500)
      await page.evaluate(markPinned)
      let top = await page.evaluate(liveTop, { id: f.id, done })
      if (top < 0 || top > vh - 40) {
        await page.evaluate((dy) => window.scrollBy({ top: dy, behavior: 'instant' }), top)
        await page.waitForTimeout(300)
        await page.evaluate(markPinned)
        top = await page.evaluate(liveTop, { id: f.id, done })
      }
      const clipY = Math.max(0, Math.round(top))
      const h = Math.min(vh - clipY, f.height - done)
      if (h <= 0) break
      const png = await page.screenshot({ clip: { x: f.x, y: clipY, width: f.width, height: h }, animations: 'disabled' })
      patches.push({ x: f.x, y: f.y + done, data: png.toString('base64') })
      done += h
    }
  }
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('[data-vault-pinned]')) el.removeAttribute('data-vault-pinned')
    window.scrollTo({ top: 0, behavior: 'instant' })
  })
  // Composite on a canvas in a scratch page and write the PNG back.
  const tool = await page.context().newPage()
  try {
    await tool.route('http://vault.local/**', (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><body></body>' }))
    await tool.goto('http://vault.local/')
    const merged = await tool.evaluate(
      async ({ base, patches }) => {
        const load = (src) =>
          new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src = src
          })
        const img = await load(`data:image/png;base64,${base}`)
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        for (const p of patches) ctx.drawImage(await load(`data:image/png;base64,${p.data}`), p.x, p.y)
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result).split(',')[1])
          reader.readAsDataURL(blob)
        })
      },
      { base: readFileSync(path).toString('base64'), patches },
    )
    writeFileSync(path, Buffer.from(merged, 'base64'))
  } finally {
    await tool.close()
  }
  return frames.length
}

function topColors(weights, n = 6) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1
  return Object.entries(weights)
    .filter(([k]) => k.startsWith('#'))
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([hex, w]) => ({ hex, share: Number((w / total).toFixed(3)) }))
}

function contextOptions(kind, ua) {
  const base = { deviceScaleFactor: 1, locale: 'en-US', reducedMotion: 'reduce', bypassCSP: true }
  return kind === 'desktop'
    ? { ...base, viewport: DESKTOP, userAgent: ua.desktop }
    : { ...base, viewport: MOBILE, userAgent: ua.mobile, isMobile: true, hasTouch: true }
}

async function openPage(browser, kind, ua) {
  const context = await browser.newContext(contextOptions(kind, ua))
  await context.addInitScript(vaultInit)
  const page = await context.newPage()
  page.on('dialog', (d) => d.dismiss().catch(() => {}))
  return { context, page }
}

async function captureSite(browser, site, ua) {
  const dir = join(OUT, site.vertical, site.slug)
  const tmp = `${dir}.tmp`
  rmSync(tmp, { recursive: true, force: true })
  mkdirSync(tmp, { recursive: true })
  const started = Date.now()
  let facts
  try {
    // Desktop: robots.txt, load, first-viewport probes, scroll pass, page
    // facts, fold JPEG + full-page PNG.
    const d = await openPage(browser, 'desktop', ua)
    let robots
    try {
      robots = await checkRobots(d.page, site.url)
      if (!robots.allowed) return { status: 'robots-disallowed', reason: robots.reason }
      const nav = await visit(d.page, site.url)
      const lcp = await d.page.evaluate(() => ({ ms: window.__vault?.lcp ?? null, tag: window.__vault?.lcpTag ?? null }))
      const timing = await d.page.evaluate(TIMING)
      const fold = await d.page.evaluate(() => window.__vault.foldSummary())
      const scroll = await d.page.evaluate(() => window.__vault.scrollThrough())
      const revealed = await afterScroll(d.page)
      const page = await d.page.evaluate(() => window.__vault.pageFacts())
      const bg = await d.page.evaluate(() => window.__vault.bg)
      const shot = await fullShot(d.page, join(tmp, 'desktop.png'), DESKTOP.width, MAX_HEIGHT.desktop, join(tmp, 'desktop-fold.jpg'))
      facts = { robots, nav, lcp, timing, fold, scroll, revealed, page, bg, shot }
    } finally {
      await d.context.close()
    }

    // Mobile: load, phone-in-first-viewport probe, scroll pass for pinned
    // call bars, mobile CTA labels, full-page PNG.
    const m = await openPage(browser, 'mobile', ua)
    try {
      const nav = await visit(m.page, site.url)
      const lcp = await m.page.evaluate(() => ({ ms: window.__vault?.lcp ?? null, tag: window.__vault?.lcpTag ?? null }))
      const timing = await m.page.evaluate(TIMING)
      const fold = await m.page.evaluate(() => window.__vault.foldSummary())
      const scroll = await m.page.evaluate(() => window.__vault.scrollThrough())
      const revealed = await afterScroll(m.page)
      const ctas = await m.page.evaluate(() => window.__vault.ctas())
      const shot = await fullShot(m.page, join(tmp, 'mobile.png'), MOBILE.width, MAX_HEIGHT.mobile)
      facts.mobile = { nav, lcp, timing, fold, scroll, revealed, ctas, shot }
    } finally {
      await m.context.close()
    }
  } catch (err) {
    rmSync(tmp, { recursive: true, force: true })
    return { status: 'failed', reason: firstLine(err), ms: Date.now() - started }
  }

  const { robots, nav, lcp, timing, fold, scroll, revealed, page, bg, shot, mobile } = facts
  const ctaLabels = []
  for (const c of [...page.ctas, ...mobile.ctas]) {
    const hit = ctaLabels.find((x) => x.label.toLowerCase() === c.label.toLowerCase())
    if (hit) hit.count++
    else ctaLabels.push({ label: c.label, count: 1, firstY: c.y, tel: c.tel })
  }
  const bgTotal = Object.values(bg).reduce((a, b) => a + b, 0) || 1
  const out = {
    vertical: site.vertical,
    segment: site.segment,
    slug: site.slug,
    company: site.company,
    metro: site.metro,
    url: site.url,
    finalUrl: nav.finalUrl,
    httpStatus: nav.status,
    search: { query: site.query, rank: site.rank, resultUrl: site.resultUrl },
    capturedAt: new Date().toISOString(),
    robots: robots.reason,
    title: page.title,
    metaDescription: page.metaDescription,
    headings: { h1: page.h1, h2: page.h2 },
    telHrefs: page.telHrefs,
    telLinkCount: page.telLinkCount,
    ctaLabels: ctaLabels.slice(0, 40),
    primaryCta: { desktop: fold.ctas[0] ?? null, mobile: mobile.fold.ctas[0] ?? null },
    fonts: page.fonts,
    colors: {
      background: topColors(bg),
      text: topColors(page.textColors),
      imageShare: Number(((bg.image || 0) / bgTotal).toFixed(3)),
      gradientShare: Number(((bg.gradient || 0) / bgTotal).toFixed(3)),
    },
    stickyHeader: scroll.sticky.header,
    stickyHeaderHeight: scroll.sticky.headerHeight,
    stickyPhone: { desktop: scroll.sticky.phone, mobile: mobile.scroll.sticky.phone },
    pinnedBars: { desktop: scroll.sticky.bars, mobile: mobile.scroll.sticky.bars },
    phoneVisibleFirstViewport390: mobile.fold.phone.numberVisible,
    callLinkVisibleFirstViewport390: mobile.fold.phone.callLinkVisible,
    phoneSeen390: mobile.fold.phone.text,
    phoneVisibleFirstViewportDesktop: fold.phone.numberVisible,
    imageCountAboveFold: fold.images.total,
    aboveFold: { desktop: fold.images, mobile: mobile.fold.images },
    heroH1: { desktop: fold.h1, mobile: mobile.fold.h1 },
    lcpMs: { desktop: lcp.ms, mobile: mobile.lcp.ms },
    lcpElement: { desktop: lcp.tag, mobile: mobile.lcp.tag },
    timing: { desktop: timing, mobile: mobile.timing },
    signals: page.signals,
    page: {
      desktopHeight: shot.height,
      mobileHeight: mobile.shot.height,
      desktopTruncated: shot.truncated,
      mobileTruncated: mobile.shot.truncated,
      unhiddenBlocks: { desktop: revealed, mobile: mobile.revealed },
      patchedIframes: { desktop: shot.patchedIframes, mobile: mobile.shot.patchedIframes },
      consentDismissed: nav.consent ?? null,
    },
    files: { desktop: 'desktop.png', mobile: 'mobile.png', fold: 'desktop-fold.jpg' },
  }
  writeFileSync(join(tmp, 'facts.json'), JSON.stringify(out, null, 2) + '\n')
  rmSync(dir, { recursive: true, force: true })
  renameSync(tmp, dir)
  return { status: 'captured', ms: Date.now() - started, desktopHeight: shot.height, mobileHeight: mobile.shot.height }
}

const list = JSON.parse(readFileSync(SITES, 'utf8'))
const picks = list.sites.filter((s) => s.role === 'primary')
const todo = picks.filter((s) => !ONLY || s.vertical === ONLY || s.slug === ONLY)
const logPath = join(OUT, 'capture-log.json')
const previous = existsSync(logPath) ? JSON.parse(readFileSync(logPath, 'utf8')).results : []
const results = new Map(previous.map((r) => [`${r.vertical}/${r.slug}`, r]))

mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
const major = browser.version().split('.')[0]
const ua = {
  desktop: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36 ${TOKEN}/1.0`,
  mobile: `Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Mobile Safari/537.36 ${TOKEN}/1.0`,
}

const queue = [...todo]
async function worker() {
  for (let site = queue.shift(); site; site = queue.shift()) {
    const key = `${site.vertical}/${site.slug}`
    let result
    if (!FORCE && existsSync(join(OUT, site.vertical, site.slug, 'facts.json'))) {
      result = { status: 'captured', reason: 'kept from an earlier run' }
    } else {
      result = await captureSite(browser, site, ua)
    }
    const line = result.status === 'captured' ? 'ok  ' : result.status === 'failed' ? 'FAIL' : 'skip'
    const detail = result.ms ? `${(result.ms / 1000).toFixed(1)}s` : ''
    const size = result.desktopHeight ? ` desktop ${result.desktopHeight}px, mobile ${result.mobileHeight}px` : ''
    console.log(`${line} ${key} ${detail}${size}${result.reason ? ` - ${result.reason}` : ''}`)
    results.set(key, { vertical: site.vertical, slug: site.slug, url: site.url, ...result, at: new Date().toISOString() })
  }
}
try {
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
} finally {
  await browser.close()
}

const all = [...results.values()].filter((r) => picks.some((p) => p.vertical === r.vertical && p.slug === r.slug))
writeFileSync(logPath, JSON.stringify({ updatedAt: new Date().toISOString(), results: all }, null, 2) + '\n')

const captured = picks.filter((p) => existsSync(join(OUT, p.vertical, p.slug, 'facts.json')))
for (const vertical of [...new Set(picks.map((p) => p.vertical))]) {
  const n = captured.filter((p) => p.vertical === vertical).length
  console.log(`${vertical}: ${n}/${picks.filter((p) => p.vertical === vertical).length} captured`)
}
const need = Math.ceil((picks.length * 30) / 36)
console.log(`\n${captured.length}/${picks.length} sites captured (need ${need}); log in ${logPath}`)
if (!ONLY && captured.length < need) process.exit(1)
