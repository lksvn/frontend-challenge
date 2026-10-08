import { test, expect } from '@playwright/test'

test('sucesso some após três segundos e reaparece na próxima ação', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.5
  })
  await page.goto('/nfts/1')
  const buy = page.locator('.purchase-primary')
  await expect(buy).toHaveCSS('font-weight', '700')
  await buy.click()
  const message = page.getByText('Adicionado ao carrinho.', { exact: true })
  await expect(message).toBeVisible()
  await expect(message).toBeHidden({ timeout: 4500 })
  await buy.click()
  await expect(message).toBeVisible()
})
