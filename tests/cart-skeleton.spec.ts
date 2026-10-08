import { test, expect } from '@playwright/test'

for (const width of [768, 1440]) {
  test(`skeleton do carrinho em ${width}px`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop')
    await page.setViewportSize({ width, height: 1000 })
    await page.addInitScript(() => {
      Math.random = () => 0.5
    })
    await page.goto('/nfts/1')
    await page.locator('.purchase-primary').click()
    await expect(page.getByText('Adicionado ao carrinho.', { exact: true })).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await page.addInitScript(() => {
      const send = XMLHttpRequest.prototype.send
      XMLHttpRequest.prototype.send = function (body) {
        setTimeout(() => send.call(this, body), 1500)
      }
    })
    await page.goto('/cart')
    await expect(page.locator('.cart-skeleton')).toBeVisible()
    const loading = await page.locator('.cart-skeleton .cart-summary').boundingBox()
    await expect(page.locator('.cart-skeleton')).toHaveCount(0)
    await expect(page.locator('.summary-skeleton')).toBeVisible()
    const pending = await page.locator('.cart-summary > .button').boundingBox()
    await expect(page.locator('.summary-skeleton')).toHaveCount(0)
    const loaded = await page.locator('.cart-summary').boundingBox()
    const ready = await page.locator('.cart-summary > .button').boundingBox()
    expect(Math.abs(loaded!.x - loading!.x)).toBeLessThan(2)
    expect(Math.abs(loaded!.width - loading!.width)).toBeLessThan(2)
    expect(Math.abs(ready!.y - pending!.y)).toBeLessThan(2)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
