import { test, expect } from '@playwright/test'
import { selectScenario } from './mock-controls'

test('falha do catálogo persiste após refresh e permite recuperação', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#catalogo .nft-card').first()).toBeVisible()
  await selectScenario(page, 'offline')
  const error = page
    .locator('#catalogo')
    .getByRole('alert')
    .filter({ hasText: 'Não foi possível carregar o catálogo' })
  await expect(error).toBeVisible()
  await page.reload()
  await expect(error).toBeVisible()
  await selectScenario(page, 'success')
  await expect(page.locator('#catalogo .nft-card').first()).toBeVisible()
  await expect(error).toHaveCount(0)
})

test('erro 503 permite tentar novamente sem perder os filtros', async ({ page }) => {
  await page.goto('/?network=Ethereum')
  await expect(page.locator('#catalogo .nft-card').first()).toBeVisible()
  await selectScenario(page, 'server-error')
  await expect(
    page
      .locator('#catalogo')
      .getByRole('alert')
      .filter({ hasText: 'Não foi possível carregar o catálogo' }),
  ).toBeVisible()
  await page.evaluate(async () => {
    const response = await fetch('/api/demo/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'success' }),
    })
    if (!response.ok) throw new Error('Não foi possível recuperar o cenário.')
  })
  await page
    .getByRole('alert')
    .filter({ hasText: 'Não foi possível carregar o catálogo' })
    .getByRole('button', { name: 'Tentar novamente', exact: true })
    .click()
  await expect(page.locator('#catalogo .nft-card').first()).toBeVisible()
  await expect(page).toHaveURL(/network=Ethereum/)
})
