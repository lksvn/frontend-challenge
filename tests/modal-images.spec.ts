import { test, expect } from '@playwright/test'

test('ícone do Google conserva 20px e a arte ampliada ocupa sua modal', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  const google = page.locator('.login-modal img[src="/assets/google.svg"]')
  await expect(google).toHaveCSS('width', '20px')
  await expect(google).toHaveCSS('height', '20px')
  await page.getByRole('button', { name: 'Fechar login' }).click()
  await page.goto('/nfts/1')
  if (testInfo.project.name === 'mobile') {
    await expect(page.getByRole('button', { name: 'Ampliar imagem', exact: true })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Ampliar imagem do NFT' })).toBeHidden()
    await page.locator('.gallery-mobile-image').click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await page.locator('.gallery-thumbnails button').last().click()
    await expect(page.locator('.gallery-thumbnails button').last()).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    return
  }
  const enlarge = page.getByRole('button', { name: 'Ampliar imagem do NFT' })
  await enlarge.hover()
  await expect(page.getByRole('tooltip')).toBeHidden()
  await page.getByRole('button', { name: 'Ampliar imagem', exact: true }).hover()
  await expect(page.getByRole('tooltip')).toHaveText('Ampliar imagem')
  await enlarge.click()
  const art = page.locator('.nft-image-modal > img')
  await expect(art).toBeVisible()
  const bounds = await art.boundingBox()
  expect(bounds!.width).toBeGreaterThan(250)
  await page.getByRole('button', { name: 'Fechar imagem' }).click()
  await expect(art).toBeHidden()
})
