import { test, expect } from '@playwright/test'

test('ações do catálogo exibem seus tooltips', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    Math.random = () => 0.5
  })
  await page.goto('/')
  const card = page.locator('#catalogo .nft-card').first()
  if (testInfo.project.name === 'mobile') {
    await card.getByRole('button', { name: 'Favoritar', exact: true }).hover()
    await expect(page.getByRole('tooltip')).toHaveText('Entre para favoritar.')
    return
  }
  const add = card.getByRole('button', { name: /Adicionar .* ao carrinho/ })
  await expect(add).toBeEnabled()
  await card.scrollIntoViewIfNeeded()
  await card.hover()
  await add.hover()
  await expect(page.getByRole('tooltip')).toHaveText('Adicionar ao carrinho')
  await page.keyboard.press('Escape')
  await card.getByRole('link', { name: /Visualizar/ }).hover()
  await expect(page.getByRole('tooltip')).toHaveText('Visualizar NFT')
})

test('favorito de visitante explica o login ao passar o mouse ou focar', async ({ page }) => {
  await page.goto('/nfts/1')
  const favorite = page.getByRole('button', { name: 'Favoritar', exact: true })
  await expect(favorite).toBeEnabled()
  await favorite.hover()
  await expect(page.getByRole('tooltip')).toHaveText('Entre para favoritar.')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('tooltip')).toBeHidden()
  await page.mouse.move(0, 0)
  await favorite.focus()
  await expect(page.getByRole('tooltip')).toHaveText('Entre para favoritar.')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('tooltip')).toBeHidden()
  await favorite.click()
  await expect(page.getByRole('dialog', { name: 'Entrar na Kurio' })).toBeVisible()
  await page.getByRole('button', { name: 'Fechar login' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
})
