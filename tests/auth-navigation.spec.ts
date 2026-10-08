import { test, expect } from '@playwright/test'

test('login mantém a página atual e retoma o destino protegido', async ({ page }, testInfo) => {
  await page.goto(testInfo.project.name === 'mobile' ? '/' : '/nfts/1')
  const currentUrl = page.url()
  const profile = page
    .getByRole('contentinfo')
    .getByRole('link', { name: 'Meu perfil', exact: true })
  await profile.click()
  const modal = page.getByRole('dialog', { name: 'Entrar na Kurio' })
  await expect(modal).toBeVisible()
  await expect(page).toHaveURL(currentUrl)
  await modal.getByRole('button', { name: 'Fechar login' }).click()
  await expect(page).toHaveURL(currentUrl)
  await profile.click()
  await modal.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await modal.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await modal.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/profile$/)
  await expect(modal).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
})
