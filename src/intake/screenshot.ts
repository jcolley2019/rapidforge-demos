import { chromium, devices } from 'playwright'

/**
 * Step 6: the current site's first viewport, desktop (1440x900) and phone
 * (390x844), as JPEG q80 buffers. Nothing is written here; the CLI writes
 * them once the brief has validated.
 */

export const DESKTOP_VIEWPORT = { width: 1440, height: 900 }
export const MOBILE_VIEWPORT = { width: 390, height: 844 }
const NAV_TIMEOUT_MS = 45_000
/** Time for hero sliders and fade-ins to settle before the shot. */
const SETTLE_MS = 1500

export interface CurrentSiteShots {
  desktop: Buffer
  mobile: Buffer
  capturedAt: string
}

export async function captureCurrentSite(url: string): Promise<CurrentSiteShots> {
  const browser = await chromium.launch()
  try {
    const shoot = async (mobile: boolean) => {
      const context = await browser.newContext(
        mobile
          ? { ...devices['iPhone 13'], viewport: MOBILE_VIEWPORT, deviceScaleFactor: 1 }
          : { viewport: DESKTOP_VIEWPORT, deviceScaleFactor: 1 },
      )
      try {
        const page = await context.newPage()
        await page.goto(url, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS })
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
        await page.waitForTimeout(SETTLE_MS)
        await page.evaluate(() => window.scrollTo(0, 0))
        return await page.screenshot({ type: 'jpeg', quality: 80, fullPage: false })
      } finally {
        await context.close()
      }
    }
    const desktop = await shoot(false)
    const mobile = await shoot(true)
    return { desktop, mobile, capturedAt: new Date().toISOString() }
  } finally {
    await browser.close()
  }
}
