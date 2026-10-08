import { test, expect } from '@playwright/test'

for (const width of [768]) {
  test(`telas principais sem overflow em ${width}px`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop')
    await page.setViewportSize({ width, height: 1024 })
    await page.addInitScript(() => {
      Math.random = () => 0.5
    })
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'KURIO' })).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'KURIO' })).toBeFocused()
    await page.goto('/profile')
    const login = page.getByRole('dialog', { name: 'Entrar na Kurio' })
    await login.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
    await login.getByLabel('Senha', { exact: true }).fill('Kurio123!')
    await login.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.locator('#profile-form')).toBeVisible()
    await page.goto('/nfts/1')
    await page.locator('.purchase-primary').click()
    await expect(page.getByText('Adicionado ao carrinho.', { exact: true })).toBeVisible()
    for (const [route, ready] of [
      ['/', '.nft-card'],
      ['/nfts/1', '.purchase-primary'],
      ['/profile', '#profile-form'],
      ['/wallets', '.wallet-fields'],
      ['/favorites', '.favorites-empty'],
      ['/cart', '.cart-row'],
      ['/checkout', '.payment-wallets'],
    ]) {
      await page.goto(route)
      await expect(page.locator(ready).first()).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        route,
      ).toBe(true)
      const clippedFields = await page
        .locator('main input:visible, main select:visible')
        .evaluateAll(
          (fields) =>
            fields.filter((field) => {
              const box = field.getBoundingClientRect()
              return box.left < 0 || box.right > innerWidth
            }).length,
        )
      expect(clippedFields, route).toBe(0)
      if (route === '/checkout') {
        const address = await page.locator('input[name="address"]').boundingBox()
        const secondary = await page.locator('input[name="secondaryAddress"]').boundingBox()
        expect(Math.abs(address!.y - secondary!.y)).toBeLessThan(1)
      }
    }
  })
}
