import { test, expect } from '@playwright/test'

test('compartilha o NFT pela API nativa e copia o link quando indisponível', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: ShareData) => {
        document.documentElement.dataset.sharedUrl = data.url
        document.documentElement.dataset.sharedTitle = data.title
      },
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (url: string) => {
          document.documentElement.dataset.copiedUrl = url
        },
      },
    })
  })
  await page.goto('/nfts/1')
  const share = page.getByRole('button', { name: 'Compartilhe este NFT', exact: true })
  await share.click()
  await expect(page.locator('html')).toHaveAttribute('data-shared-url', /\/nfts\/1$/)
  await expect(page.locator('html')).toHaveAttribute('data-shared-title', 'Emerald Ape #042')
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', { value: undefined })
  })
  await share.click()
  await expect(page.locator('html')).toHaveAttribute('data-copied-url', /\/nfts\/1$/)
  await expect(page.getByText('Link copiado.', { exact: true })).toBeVisible()
})
