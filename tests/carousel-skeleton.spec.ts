import { test, expect } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`skeleton de recomendações em ${width}px`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop')
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      Math.random = () => 0.5
      const send = XMLHttpRequest.prototype.send
      XMLHttpRequest.prototype.send = function (body) {
        setTimeout(() => send.call(this, body), 1800)
      }
    })
    await page.goto('/cart')
    const track = page.locator('.cart-recommendations .recommendations-track')
    await expect(track).toHaveAttribute('aria-busy', 'true')
    const loading = await track.boundingBox()
    const count = await track.locator('.nft-card').count()
    await expect(track).toHaveAttribute('aria-busy', 'false')
    const loaded = await track.boundingBox()
    await expect(track.locator('.recommendations-page').first().locator('.nft-card')).toHaveCount(
      count,
    )
    expect(Math.abs(loaded!.height - loading!.height)).toBeLessThan(2)
    expect(Math.abs(loaded!.width - loading!.width)).toBeLessThan(2)
  })
}
