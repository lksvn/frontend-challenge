import { test, expect } from '@playwright/test'

test('fechar compra confirmada retorna ao catálogo', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.5
  })
  await page.goto('/profile')
  const login = page.getByRole('dialog', { name: 'Entrar na Kurio' })
  await login.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await login.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await login.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.locator('#profile-form')).toBeVisible()
  await page.goto('/nfts/1')
  await page.locator('.purchase-primary').click()
  await expect(page.getByText('Adicionado ao carrinho.', { exact: true })).toBeVisible()
  await page.goto('/checkout')
  await page.getByRole('button', { name: 'Conectar', exact: true }).click()
  const toggle = page.getByRole('button', { name: 'Dados do coletor', exact: true })
  if (await toggle.isVisible()) await toggle.click()
  await page.getByLabel('Nome de usuário', { exact: true }).fill('ana')
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('Seus NFTs agora estão na sua carteira')
  await page.getByRole('button', { name: 'Fechar recibo' }).click()
  await expect(page).toHaveURL(/#catalogo$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
