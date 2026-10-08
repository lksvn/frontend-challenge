import { test, expect } from '@playwright/test'

test('carrinho vazio permite explorar e catálogo vazio permite limpar filtros', async ({
  page,
}) => {
  await page.goto('/cart')
  await expect(page.getByText('Seu carrinho está vazio.', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Explorar NFTs', exact: true }).click()
  await expect(page).toHaveURL(/#catalogo$/)
  await page.goto('/?q=nft-inexistente-999999')
  await expect(page.getByText('Nenhum NFT encontrado.', { exact: true })).toBeVisible()
  await expect(page.locator('.pagination')).toHaveCount(0)
  await page.getByRole('button', { name: 'Limpar filtros', exact: true }).click()
  await expect(page.locator('.nft-card').first()).toBeVisible()
})

test('sessão expirada permite autenticar novamente no perfil', async ({ page }) => {
  await page.goto('/profile')
  const login = page.getByRole('dialog', { name: 'Entrar na Kurio' })
  await login.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await login.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await login.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.locator('#profile-form')).toBeVisible()
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('kurio.mock.v1')!)
    state.session.expiresAt = 0
    localStorage.setItem('kurio.mock.v1', JSON.stringify(state))
  })
  await page.reload()
  await expect(login).toBeVisible()
  await login.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await login.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await login.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.locator('#profile-form')).toBeVisible()
})
