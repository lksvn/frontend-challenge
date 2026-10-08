import { test, expect } from '@playwright/test'

test('favoritos podem ser listados e removidos sem quebrar o perfil', async ({
  page,
}, testInfo) => {
  await page.goto('/profile')
  const login = page.getByRole('dialog', { name: 'Entrar na Kurio' })
  await login.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await login.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await login.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.locator('#profile-form')).toBeVisible()
  await expect(page.locator('.header-actions')).toBeVisible()
  if (testInfo.project.name !== 'mobile') {
    await expect(page.locator('.mobile-page-heading')).toBeHidden()
    const menu = await page.locator('.account-menu').boundingBox()
    const form = await page.locator('#profile-form').boundingBox()
    expect(form!.x).toBeGreaterThan(menu!.x + menu!.width)
  }
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Meu perfil · Dados do perfil' }).click()
  }
  await page.evaluate(async () => {
    await fetch('/api/favorites/1', { method: 'PUT' })
  })
  await page
    .locator('.account-menu')
    .getByRole('link', { name: 'Lista de interesse', exact: true })
    .click()
  await expect(page.locator('.account-menu')).toBeVisible()
  if (testInfo.project.name === 'mobile') {
    await expect(
      page.getByRole('button', { name: 'Meu perfil · Lista de interesse' }),
    ).toHaveAttribute('aria-expanded', 'false')
  }
  await expect(page.locator('.account-menu a[aria-current="page"]')).toHaveText(
    'Lista de interesse',
  )
  const row = page.locator('.favorite-row')
  await expect(row).toHaveCount(1)
  await expect(row.locator('img')).toBeVisible()
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
    await page.screenshot({ path: `reports/favorites-${width}.png`, fullPage: true })
  }
  await row.getByRole('button', { name: 'Favoritado', exact: true }).click()
  await expect(row).toHaveCount(0)
  await expect(page.getByText('Você ainda não favoritou nenhum NFT.')).toBeVisible()
  await page.setViewportSize({ width: 390, height: 900 })
  await page.locator('.mobile-nav-start').getByRole('link', { name: 'Início', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('#catalogo')).toBeVisible()
})
