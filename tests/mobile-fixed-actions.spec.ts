import { test, expect } from '@playwright/test'

test('ações fixas acompanham mudanças da altura da viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile')
  await page.addInitScript(() => {
    Math.random = () => 0.5
  })
  await page.goto('/nfts/1')
  await page.locator('.purchase-primary').click()
  await expect(page.getByText('Adicionado ao carrinho.', { exact: true })).toBeVisible()
  for (const [route, selector] of [
    ['/', '.header-actions'],
    ['/nfts/1', '.nft-purchase-actions'],
    ['/cart', '.cart-summary'],
    ['/checkout', '.payment-actions'],
  ]) {
    await page.goto(route)
    if (route === '/checkout') {
      const login = page.getByRole('dialog', { name: 'Entrar na Kurio' })
      await login.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
      await login.getByLabel('Senha', { exact: true }).fill('Kurio123!')
      await login.getByRole('button', { name: 'Entrar', exact: true }).click()
    }
    await expect(page.locator(selector)).toBeVisible()
    for (const height of [700, 844, 700]) {
      await page.setViewportSize({ width: 390, height })
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
      await expect
        .poll(async () => {
          const box = await page.locator(selector).boundingBox()
          return Math.abs(box!.y + box!.height - height)
        })
        .toBeLessThan(2)
    }
  }
})
