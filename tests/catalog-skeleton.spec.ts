import { test, expect } from '@playwright/test'

for (const width of [320, 390, 414, 600, 601, 768, 900, 901, 1024, 1440]) {
  test(`skeleton da página inicial em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      Math.random = () => 0.5
      const send = XMLHttpRequest.prototype.send
      XMLHttpRequest.prototype.send = function (body) {
        setTimeout(() => send.call(this, body), 2500)
      }
    })
    await page.goto('/')
    const skeletons = page.locator('.nft-card-skeleton')
    await expect(skeletons).toHaveCount(9)
    await page.evaluate(() => document.fonts.ready)
    const bounds = (selector: string) =>
      page.locator(selector).evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect()
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        }),
      )
    const loading = await bounds('.nft-card-skeleton')
    const filtersBefore = await bounds('.filters')
    const promosBefore = await bounds('.promos')
    await expect(skeletons).toHaveCount(0)
    await expect(page.locator('.filter-option-skeleton')).toHaveCount(0)
    const loaded = await bounds('.nft-grid > .nft-card')
    const filtersAfter = await bounds('.filters')
    const promosAfter = await bounds('.promos')
    for (let index = 0; index < loaded.length; index++) {
      for (const property of ['x', 'y', 'width', 'height'] as const) {
        expect(
          Math.abs(loading[index][property] - loaded[index][property]),
          `card ${index + 1}, ${property}`,
        ).toBeLessThan(2)
      }
    }
    expect(Math.abs(filtersBefore[0].height - filtersAfter[0].height)).toBeLessThan(2)
    expect(Math.abs(promosBefore[0].y - promosAfter[0].y)).toBeLessThan(2)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
  })
}
