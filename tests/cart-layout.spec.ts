import { test, expect } from '@playwright/test'

test('carrinho altera quantidade, recalcula total e remove item', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    Math.random = () => 0.5
  })
  await page.goto('/nfts/1')
  await page.locator('.purchase-primary').click()
  await expect(page.getByText('Adicionado ao carrinho.', { exact: true })).toBeVisible()
  await page
    .locator('.header-actions button[aria-label="Carrinho"]:visible, .mobile-cart-action:visible')
    .first()
    .click()
  if (testInfo.project.name === 'mobile') {
    await expect(page.locator('.header-actions')).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Carrinho de NFTs', exact: true })).toBeVisible()
    const summary = page.locator('.cart-summary')
    await expect(summary).toHaveCSS('position', 'fixed')
    const initial = await summary.boundingBox()
    await page.evaluate(() => window.scrollTo(0, 150))
    expect((await summary.boundingBox())!.y).toBe(initial!.y)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: 'reports/mobile-cart.png' })
  }
  const row = page.locator('.cart-row').first()
  await expect(row.locator('.cart-line-total')).toContainText('0.952 ETH')
  const before = await page.getByRole('button', { name: 'Conectar e finalizar' }).boundingBox()
  await page.route('**/api/quote', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400))
    await route.fallback()
  })
  await page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' }).click()
  await expect(row.locator('output')).toHaveText('2')
  await expect(page.locator('.cart-summary .summary')).toBeVisible()
  await expect(page.getByLabel('Carregando resumo')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Conectar e finalizar' })).toBeEnabled()
  const after = await page.getByRole('button', { name: 'Conectar e finalizar' }).boundingBox()
  expect(after!.y).toBe(before!.y)
  await expect(row.locator('.cart-line-total')).toContainText('1.904 ETH')
  await page.getByRole('button', { name: 'Diminuir quantidade de Emerald Ape #042' }).click()
  await expect(row.locator('output')).toHaveText('1')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.getByRole('button', { name: 'Remover Emerald Ape #042' }).click()
  await expect(page.getByText('Seu carrinho está vazio.', { exact: true })).toBeVisible()
})
