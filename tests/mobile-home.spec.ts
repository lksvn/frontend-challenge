import { test, expect } from '@playwright/test'

test('início mobile mantém busca, filtros e navegação acessíveis', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile')
  await page.addInitScript(() => {
    Math.random = () => 0.5
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'SEJA DONO DA CULTURA DIGITAL' })).toBeVisible()
  await expect(page.locator('#catalogo .nft-grid .nft-card').first()).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.getByRole('button', { name: 'Filtros do catálogo' }).click()
  await expect(page.getByRole('dialog', { name: 'Filtros do catálogo' })).toBeVisible()
  await page.getByRole('button', { name: /^Colecionáveis \(\d+\)$/ }).click()
  await expect(page).toHaveURL(/category=Colecion%C3%A1veis/)
  await page.getByRole('button', { name: 'Fechar filtros' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  await page.getByRole('button', { name: 'Filtros do catálogo' }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  const search = page.getByRole('searchbox', { name: 'Explorar coleções' })
  await search.fill('Emerald')
  await search.press('Enter')
  await expect(page).toHaveURL(/q=Emerald/)
  await page.getByRole('button', { name: 'Carrinho', exact: true }).click()
  await expect(page).toHaveURL(/\/cart$/)
})
