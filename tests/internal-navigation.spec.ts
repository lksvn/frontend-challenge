import { test, expect } from '@playwright/test'

test('navegação interna preserva o documento e os filtros de destino', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop')
  await page.goto('/nfts/1')
  const documentMarker = await page.evaluate(() => {
    const marker = document.createElement('meta')
    marker.id = 'navigation-document-marker'
    document.head.append(marker)
    return marker.id
  })
  const nav = page.getByRole('navigation', { name: 'Principal', exact: true })
  for (const [name, hash] of [
    ['Mercado', 'catalogo'],
    ['Criadores', 'criadores'],
    ['Aprenda', 'aprenda'],
  ]) {
    await nav.getByRole('link', { name, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`#${hash}$`))
    await expect(nav.locator('a[aria-current]')).toHaveCount(1)
    await expect(nav.locator('a[aria-current]')).toHaveText(name)
    await expect(page.locator(`#${documentMarker}`)).toHaveCount(1)
    await expect(page.locator(`#${hash}`)).toBeInViewport()
  }
  await page
    .locator('.promo-card')
    .first()
    .getByRole('link', { name: 'Explorar', exact: true })
    .click()
  await expect(page).toHaveURL(/category=Arte\+digital#catalogo$/)
  await expect(page.locator(`#${documentMarker}`)).toHaveCount(1)
})
