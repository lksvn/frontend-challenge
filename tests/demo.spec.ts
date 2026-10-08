import { test, expect } from '@playwright/test'
import { clickDemo, selectScenario } from './demo-controls'

test('painel flutuante abre pelo teclado sem deslocar a página', async ({ page }) => {
  await page.goto('/nfts/1')
  await expect(page.locator('.detail-layout .price')).toHaveText('1.19 ETH')
  await expect(page.locator('.related .nft-card').first()).toBeVisible()
  const panel = page.locator('.demo-panel')
  const details = panel.locator('details')
  const before = await page.locator('main').boundingBox()
  await expect(details).not.toHaveAttribute('open')
  await panel.locator('summary').focus()
  await page.keyboard.press('Enter')
  await expect(details).toHaveAttribute('open', '')
  expect(await page.locator('main').boundingBox()).toEqual(before)
  const bounds = await panel.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.y).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height)
  await page.keyboard.press('Enter')
  await expect(details).not.toHaveAttribute('open')
})

test('eventos duplicados e antigos explicam o descarte sem alterar dados', async ({ page }) => {
  await page.goto('/nfts/2')
  await expect(page.locator('.detail-layout .price')).toHaveText('1.69 ETH')
  await expect(page.getByText('Socket.IO: conectado')).toBeVisible()
  await expect(page.getByLabel('NFT da simulação')).toHaveValue('2')
  await clickDemo(page, 'Evento duplicado')
  await expect(page.locator('.demo-panel [role="status"]')).toContainText(
    'Evento duplicado de Sage Nomad #009 descartado',
  )
  await expect(page.locator('.detail-layout .price')).toHaveText('1.69 ETH')
  await clickDemo(page, 'Evento antigo')
  await expect(page.locator('.demo-panel [role="status"]')).toContainText(
    'Evento antigo de Sage Nomad #009 descartado',
  )
  await expect(page.locator('.detail-layout .price')).toHaveText('1.69 ETH')
  await clickDemo(page, 'Evento antigo de pedido')
  await expect(page.locator('.demo-panel [role="status"]')).toContainText(
    'Nenhum pedido da sua sessão',
  )
  await clickDemo(page, 'Simular mudança de preço')
  await expect(page.locator('.detail-layout .price')).toHaveText('1.79 ETH')
})

test('cenário ativo sobrevive a refresh e a seleção permite recuperar conexão', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByLabel('Cenário de demonstração')).toHaveValue('success')
  await selectScenario(page, 'offline')
  await expect(
    page.getByRole('alert').filter({ hasText: 'Não foi possível carregar' }),
  ).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Cenário de demonstração')).toHaveValue('offline')
  await expect(page.locator('.demo-panel')).toContainText('As próximas requisições REST falham')
  await selectScenario(page, 'success')
  await expect(page.getByRole('status').filter({ hasText: '36 resultados' })).toBeVisible()
})
