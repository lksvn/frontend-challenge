import { test, expect } from '@playwright/test'

for (const declined of [false, true]) {
  test(`fechar compra ${declined ? 'recusada retorna ao carrinho' : 'confirmada retorna ao catálogo'}`, async ({
    page,
  }) => {
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
    if (declined) {
      await page.evaluate(() => {
        const state = JSON.parse(localStorage.getItem('kurio.mock.v1')!)
        state.scenario = 'declined'
        localStorage.setItem('kurio.mock.v1', JSON.stringify(state))
      })
    }
    await page.goto('/checkout')
    await page.getByRole('button', { name: 'Conectar', exact: true }).click()
    const toggle = page.getByRole('button', { name: 'Dados do coletor', exact: true })
    if (await toggle.isVisible()) await toggle.click()
    const username = page.getByLabel('Nome de usuário', { exact: true })
    if (await username.isVisible()) await username.fill('ana')
    await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
    await expect(page.getByRole('dialog')).toContainText(
      declined ? 'Pagamento recusado' : 'Seus NFTs agora estão na sua carteira',
    )
    await page.getByRole('button', { name: 'Fechar recibo' }).click()
    await expect(page).toHaveURL(declined ? /\/cart$/ : /#catalogo$/)
    if (declined) await expect(page.locator('.cart-row')).toHaveCount(1)
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
}

test('erro ao consultar pedido mantém a modal e permite sair', async ({ page }) => {
  await page.goto('/profile')
  const login = page.getByRole('dialog', { name: 'Entrar na Kurio' })
  await login.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await login.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await login.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.locator('#profile-form')).toBeVisible()
  await page.goto('/orders/inexistente')
  await expect(page.getByRole('dialog')).toContainText('Não foi possível carregar o pedido')
  await expect(page.getByRole('button', { name: 'Tentar novamente', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Fechar recibo' }).click()
  await expect(page).toHaveURL(/\/cart$/)
})
