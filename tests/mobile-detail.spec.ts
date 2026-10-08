import { test, expect } from '@playwright/test'

test('detalhe mobile adiciona sem navegar e abre o carrinho separadamente', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile')
  await page.addInitScript(() => {
    Math.random = () => 0.5
  })
  await page.goto('/nfts/1')
  await expect(page.locator('.header-actions')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Voltar ao catálogo', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Favoritar', exact: true }).click()
  const login = page.getByRole('dialog', { name: 'Entrar na Kurio' })
  await expect(login).toBeVisible()
  expect(
    await login.evaluate((dialog) => {
      const topElement = document.elementFromPoint(innerWidth / 2, innerHeight - 100)
      return dialog.contains(topElement)
    }),
  ).toBe(true)
  await page.getByRole('button', { name: 'Fechar login' }).click()
  const actions = page.locator('.nft-purchase-actions')
  const gallery = page.locator('.gallery-main')
  const information = page.locator('.detail-information')
  const initialActions = await actions.boundingBox()
  const initialGallery = await gallery.boundingBox()
  const initialInformation = await information.boundingBox()
  await page.evaluate(() => window.scrollTo(0, 200))
  await expect
    .poll(async () => (await information.boundingBox())!.y)
    .toBeLessThan(initialInformation!.y - 150)
  expect((await actions.boundingBox())!.y).toBe(initialActions!.y)
  expect((await gallery.boundingBox())!.y).toBe(initialGallery!.y)
  await page.locator('.detail-tabs').scrollIntoViewIfNeeded()
  const purchaseButton = page.getByRole('button', { name: 'Comprar NFT', exact: true })
  expect(
    await purchaseButton.evaluate((button) => {
      const bounds = button.getBoundingClientRect()
      const topElement = document.elementFromPoint(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
      )
      return button.contains(topElement)
    }),
  ).toBe(true)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.getByRole('button', { name: 'Aumentar quantidade', exact: true }).click()
  const beforeFeedback = await actions.boundingBox()
  await page.getByRole('button', { name: 'Comprar NFT', exact: true }).click()
  await expect(page.locator('.nft-purchase-actions .purchase-feedback')).toHaveText(
    'Adicionado ao carrinho.',
  )
  await expect(page.locator('.nft-purchase-actions .purchase-feedback')).toBeVisible()
  expect((await actions.boundingBox())!.height).toBe(beforeFeedback!.height)
  expect((await actions.boundingBox())!.y).toBe(beforeFeedback!.y)
  await expect(page).toHaveURL(/nfts\/1$/)
  await expect(page.locator('.mobile-cart-action .cart-count')).toHaveText('2')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'reports/mobile-detail.png', fullPage: true })
  await page.getByRole('link', { name: 'Abrir carrinho' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await expect(page.locator('.cart-row').first().locator('output')).toHaveText('2')
  await page.goto('/nfts/1')
  await page.getByRole('button', { name: 'Voltar ao catálogo', exact: true }).click()
  await expect(page).not.toHaveURL(/nfts\/1$/)
})
