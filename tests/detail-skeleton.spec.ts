import { test, expect } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`galeria do skeleton em ${width}px`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop')
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      Math.random = () => 0.5
      const send = XMLHttpRequest.prototype.send
      XMLHttpRequest.prototype.send = function (body) {
        setTimeout(() => send.call(this, body), 1800)
      }
    })
    await page.goto('/nfts/1')
    await expect(page.locator('.detail-skeleton')).toBeVisible()
    const loading = await page.locator('.gallery-main').boundingBox()
    await expect(page.locator('.detail-skeleton')).toHaveCount(0)
    const loaded = await page.locator('.gallery-main').boundingBox()
    expect(Math.abs(loaded!.x - loading!.x)).toBeLessThan(2)
    expect(Math.abs(loaded!.width - loading!.width)).toBeLessThan(2)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
