import { test, expect } from '@playwright/test'
import { clickDemo, selectScenario } from './demo-controls'

test('navegação destaca a página ou seção atual', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Principal', exact: true })
  await expect(nav.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page')
  await nav.getByRole('link', { name: 'Mercado' }).click()
  await expect(nav.getByRole('link', { name: 'Mercado' })).toHaveAttribute(
    'aria-current',
    'location',
  )
  await expect(nav.getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current')
  await page.goto('/nfts/1')
  await expect(nav.getByRole('link', { name: 'Mercado' })).toHaveAttribute(
    'aria-current',
    'location',
  )
})

test('ações do card e tag de raridade', async ({ page }) => {
  await page.goto('/')
  const card = page.locator('#catalogo .nft-card').first()
  await expect(card.locator('.nft-rarity')).toHaveText('RARO')
  await card.getByRole('link', { name: 'Ver Emerald Ape #042', exact: true }).focus()
  await card.getByRole('button', { name: 'Adicionar Emerald Ape #042 ao carrinho' }).click()
  await expect(page.getByRole('banner').locator('.cart-count')).toHaveText('1')
  await expect(card.getByRole('button', { name: 'Favoritar', exact: true })).toBeDisabled()
  await card.getByRole('link', { name: 'Visualizar Emerald Ape #042' }).click()
  await expect(page).toHaveURL(/\/nfts\/1$/)
})

test('destaque, avaliações, edições e quantidade no detalhe', async ({ page }) => {
  await page.goto('/')
  const featured = page.getByRole('region', { name: 'NFT em destaque' })
  await expect(featured.getByText('OFERTA LIMITADA')).toBeVisible()
  await featured.getByRole('link', { name: 'Ver Sage Nomad #009' }).click()
  await expect(page).toHaveURL(/\/nfts\/2$/)
  await page.goto('/nfts/1')
  await expect(page.getByRole('img', { name: 'Avaliação: 4.8 de 5 estrelas' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Detalhes do NFT', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByRole('tab', { name: 'Avaliações de colecionadores (19)' })).toBeDisabled()
  await expect(page.getByRole('radio', { name: '1/50', exact: true })).toBeChecked()
  await expect(page.getByRole('radio', { name: 'ABERTA', exact: true })).toBeDisabled()
  const increase = page.getByRole('button', { name: 'Aumentar quantidade' })
  await expect(page.getByRole('button', { name: 'Diminuir quantidade' })).toBeDisabled()
  for (let quantity = 1; quantity < 10; quantity++) {
    await increase.click()
  }
  await expect(page.getByLabel('Quantidade', { exact: true })).toHaveText('10')
  await expect(increase).toBeDisabled()
  await page.getByRole('button', { name: 'Diminuir quantidade' }).click()
  await expect(page.getByLabel('Quantidade', { exact: true })).toHaveText('9')
})

test('filtros combinados, ordenação e resposta obsoleta não regressam catálogo', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('status').filter({ hasText: '36 resultados' })).toBeVisible()
  await page.getByRole('button', { name: 'Arte digital (9)', exact: true }).click()
  await page.getByRole('button', { name: 'Ethereum (12)', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: '3 resultados' })).toBeVisible()
  await selectScenario(page, 'variable')
  const slowRequest = page.waitForRequest(
    (request) => request.url().includes('/api/nfts?') && request.url().includes('sort=price-asc'),
  )
  await page.getByLabel('Ordenar por').selectOption('price-asc')
  const obsolete = await slowRequest
  const cancellation = page.waitForEvent('requestfailed', {
    predicate: (request) => request === obsolete,
  })
  await page.getByLabel('Ordenar por').selectOption('price-desc')
  await cancellation
  await expect(page).toHaveURL(/sort=price-desc/)
  await expect(page.locator('#catalogo .nft-card').first()).toContainText('1.43 ETH')
  await page.reload()
  await expect(page.getByLabel('Ordenar por')).toHaveValue('price-desc')
  await expect(page.getByRole('status').filter({ hasText: '3 resultados' })).toBeVisible()
  await page.goBack()
  await expect(page.getByLabel('Ordenar por')).toHaveValue('price-asc')
  await expect(page.locator('#catalogo .nft-card').first()).toContainText('1.19 ETH')
})

test('falha de conexão REST oferece recuperação sem perder filtros', async ({ page }) => {
  await page.goto('/?network=Ethereum')
  await expect(page.getByRole('status').filter({ hasText: '12 resultados' })).toBeVisible()
  await selectScenario(page, 'offline')
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: 'Não foi possível carregar a atualização do catálogo' }),
  ).toBeVisible()
  await selectScenario(page, 'success')
  await expect(page.getByRole('status').filter({ hasText: '12 resultados' })).toBeVisible()
  await expect(page).toHaveURL(/network=Ethereum/)
})

test('primeiro evento antigo é descartado contra a versão REST', async ({ page }) => {
  await page.goto('/nfts/1')
  await expect(page.locator('.detail-layout .price')).toContainText('0.952 ETH')
  await expect(page.getByText('Socket.IO: conectado')).toBeVisible()
  await clickDemo(page, 'Evento antigo')
  await expect(page.locator('.demo-panel [role="status"]')).toContainText('Evento antigo')
  await expect(page.locator('.demo-panel [role="status"]')).toContainText('descartado')
  await expect(page.locator('.detail-layout .price')).toContainText('0.952 ETH')
  await expect(page.getByRole('radio', { name: '1/50', exact: true })).toBeChecked()
  await expect(page.getByRole('radio', { name: '1/1', exact: true })).toBeDisabled()
  await page.goto('/nfts/36')
  await expect(page.getByRole('button', { name: 'Edição esgotada' })).toBeDisabled()
})

test('REST: filtros, paginação, refresh e histórico', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('status').filter({ hasText: '36 resultados' })).toBeVisible()
  await page.getByRole('button', { name: '2', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect
    .poll(async () => {
      const heading = await page.getByRole('heading', { name: 'Todos os NFTs' }).boundingBox()
      return heading?.y
    })
    .toBeLessThan(80)
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Música (9)', exact: true }).click()
  await expect(page).not.toHaveURL(/page=/)
  await expect(page.getByRole('status').filter({ hasText: '9 resultados' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Música (9)', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.goBack()
  await expect(page).toHaveURL(/page=2/)
})

test('Socket.IO: evento atualiza REST e preço na interface', async ({ page }) => {
  await page.goto('/nfts/1')
  await expect(page.getByText('Socket.IO: conectado')).toBeVisible()
  await expect(page.locator('.detail-layout .price')).toContainText('0.952 ETH')
  await clickDemo(page, 'Simular mudança de preço')
  await expect(page.locator('.detail-layout .price')).toHaveText('1.29 ETH')
  await expect(page.getByRole('status').filter({ hasText: 'Preço atualizado' })).toContainText(
    '1.29 ETH',
  )
})

test('detalhe direto e NFT inexistente', async ({ page }) => {
  await page.goto('/nfts/1')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await page.goto('/nfts/inexistente')
  await expect(page.getByRole('heading', { name: 'NFT indisponível' })).toBeVisible()
})

test('skeleton lento, HTTP 503 e recuperação', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Socket.IO: conectado')).toBeVisible()
  await Promise.all([
    page.waitForResponse((response) => response.url().endsWith('/api/demo/scenario')),
    selectScenario(page, 'slow'),
  ])
  await page.reload()
  await expect(page.getByLabel('Carregando NFTs')).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: '36 resultados' })).toBeVisible({
    timeout: 10_000,
  })
  await selectScenario(page, 'server-error')
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: 'Não foi possível carregar a atualização do catálogo' }),
  ).toBeVisible()
  await selectScenario(page, 'success')
  await expect(page.getByRole('status').filter({ hasText: '36 resultados' })).toBeVisible()
})

test('filtros preservam rolagem e URL contém somente valores selecionados', async ({ page }) => {
  await page.goto('/?q=&category=&network=&sort=recent&page=1')
  await expect(page.getByRole('button', { name: 'Música (9)', exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/$/)
  await page.locator('#catalogo').scrollIntoViewIfNeeded()
  const scrollBefore = await page.evaluate(() => window.scrollY)
  await page.getByRole('button', { name: 'Música (9)', exact: true }).click()
  await expect(page).toHaveURL(/category=/)
  await expect(page).not.toHaveURL(/q=|network=|sort=|page=/)
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(scrollBefore - 5)
  await page.getByRole('slider', { name: 'Preço mínimo em ETH', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page).not.toHaveURL(/min=/)
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page).toHaveURL(/min=0.03/)
  await page.getByRole('button', { name: 'Limpar filtros' }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.locator('.nft-card').first().click()
  await expect(page).not.toHaveURL(/\?/)
})

test('login abre sobre a página atual, fecha por Escape e preserva filtros', async ({ page }) => {
  await page.goto('/?category=Música')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Entrar na Kurio' })).toBeVisible()
  await expect(page).toHaveURL(/category=/)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('dialog').getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('banner').getByRole('button', { name: 'Meu perfil' })).toBeVisible()
  await expect(page).toHaveURL(/category=/)
})

test('títulos alternam login e cadastro no mesmo modal sem mudar a URL', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile'
  await page.goto('/nfts/1')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail', { exact: true }).fill('errado@kurio.test')
  await dialog.getByLabel('Senha', { exact: true }).fill('senhaerrada')
  await dialog.getByRole('button', { name: 'Mostrar senha', exact: true }).click()
  await expect(dialog.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text')
  await expect(dialog.getByLabel('Senha', { exact: true })).toHaveValue('senhaerrada')
  await dialog.getByRole('button', { name: 'Ocultar senha', exact: true }).click()
  await expect(dialog.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'password')
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('incorretos')
  if (mobile) await dialog.getByRole('button', { name: 'Novo na Kurio? Crie uma conta' }).click()
  else await dialog.getByRole('tab', { name: 'Criar conta', exact: true }).click()
  await expect(dialog.getByRole('alert')).toBeHidden()
  await expect(page).toHaveURL(/\/nfts\/1$/)
  await dialog.getByLabel('Nome de usuário').fill('pessoa_teste')
  await dialog.getByLabel('E-mail', { exact: true }).fill('pessoa@kurio.test')
  await dialog.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await dialog.getByLabel('Confirmar senha', { exact: true }).fill('Kurio123!')
  await dialog.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()
  if (mobile) await expect(dialog.locator('.auth-mobile-title')).toHaveText('Entrar')
  else await expect(dialog.getByRole('tab', { name: 'Entrar', exact: true })).toHaveAttribute('aria-selected', 'true')
  await expect(dialog.getByRole('status')).toContainText('Conta criada')
  await expect(page).toHaveURL(/\/nfts\/1$/)
  if (!mobile) {
    await dialog.getByRole('tab', { name: 'Criar conta', exact: true }).focus()
    await page.keyboard.press('ArrowLeft')
    await expect(dialog.getByRole('tab', { name: 'Entrar', exact: true })).toBeFocused()
  } else {
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})

test('lupa abre busca sem deslocar cabeçalho e mantém filtros na URL', async ({ page }) => {
  await page.goto('/?category=Arte+digital&page=2')
  await expect(page.getByRole('button', { name: 'Arte digital (9)', exact: true })).toBeVisible()
  const headerBefore = await page.locator('.site-header').boundingBox()
  const trigger = page.getByRole('button', { name: 'Abrir busca', exact: true })
  await expect(page.getByLabel('Buscar NFTs', { exact: true })).toHaveCount(0)
  await trigger.click()
  const input = page.getByRole('search').getByRole('searchbox', { name: 'Buscar NFTs' })
  await expect(input).toBeFocused()
  expect(await page.locator('.site-header').boundingBox()).toEqual(headerBefore)
  const panel = await page.getByRole('dialog', { name: 'Buscar NFTs' }).boundingBox()
  expect(panel!.x).toBeGreaterThanOrEqual(0)
  expect(panel!.x + panel!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  await input.fill('Emerald')
  await expect(page).not.toHaveURL(/q=/)
  await input.press('Enter')
  await expect(page).toHaveURL(/q=Emerald/)
  await expect(page).toHaveURL(/category=Arte\+digital/)
  await expect(page).not.toHaveURL(/page=/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.nft-card').first()).toContainText('Emerald')
  await page.reload()
  await trigger.click()
  await expect(input).toHaveValue('Emerald')
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await trigger.click()
  await input.fill('')
  await input.press('Enter')
  await expect(page).not.toHaveURL(/q=/)
  await expect(page).toHaveURL(/category=/)
})

test('busca no detalhe leva ao catálogo', async ({ page }) => {
  await page.goto('/nfts/1')
  await page.getByRole('button', { name: 'Abrir busca' }).click()
  const input = page.getByRole('searchbox', { name: 'Buscar NFTs' })
  await input.fill('Sage')
  await input.press('Enter')
  await expect(page).toHaveURL(/\/\?q=Sage$/)
  await expect(page.locator('.nft-card').first()).toContainText('Sage')
})

test('hero troca artes pelos pontos com mouse e teclado', async ({ page }) => {
  await page.goto('/')
  const hero = page.getByRole('region', { name: 'Destaques' })
  const image = hero.getByRole('img')
  await expect(image).toHaveAttribute('src', '/assets/nft-2.webp')
  await hero.getByRole('button', { name: 'Exibir slide 2' }).click()
  await expect(image).toHaveAttribute('src', '/assets/nft-1.webp')
  const third = hero.getByRole('button', { name: 'Exibir slide 3' })
  await third.focus()
  await third.press('Enter')
  await expect(image).toHaveAttribute('src', '/assets/nft-3.webp')
  await expect(third).toHaveAttribute('aria-current', 'true')
  await expect(hero.getByRole('heading', { level: 1 })).toBeVisible()
})

test('seleções do catálogo filtram pela API e persistem na URL', async ({ page }) => {
  await page.goto('/')
  const views = page.getByRole('navigation', { name: 'Seleção do catálogo' })
  await views.getByRole('button', { name: 'Novos lançamentos' }).click()
  await expect(page).toHaveURL(/view=new/)
  await expect(page.getByRole('status').filter({ hasText: '9 resultados' })).toBeVisible()
  await page.reload()
  await expect(views.getByRole('button', { name: 'Novos lançamentos' })).toHaveAttribute(
    'aria-current',
    'true',
  )
  await views.getByRole('button', { name: 'Em alta' }).click()
  await expect(page.getByRole('status').filter({ hasText: '6 resultados' })).toBeVisible()
  await views.getByRole('button', { name: 'Todos os NFTs' }).click()
  await expect(page).not.toHaveURL(/view=/)
  await expect(page.getByRole('status').filter({ hasText: '36 resultados' })).toBeVisible()
})

test('paginação anterior e próxima respeita os limites', async ({ page }) => {
  await page.goto('/')
  const pagination = page.getByRole('navigation', { name: 'Paginação' })
  const previous = pagination.getByRole('button', { name: 'Página anterior' })
  const next = pagination.getByRole('button', { name: 'Próxima página' })
  await expect(previous).toHaveCount(0)
  await next.click()
  await expect(page).toHaveURL(/page=2/)
  await expect(pagination.getByRole('button', { name: '2', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await previous.click()
  await expect(page).not.toHaveURL(/page=/)
  await pagination.getByRole('button', { name: '4', exact: true }).click()
  await expect(next).toHaveCount(0)
  await page.goto('/?view=trending')
  await expect(pagination.getByRole('button', { name: '1', exact: true })).toBeVisible()
  await expect(previous).toHaveCount(0)
  await expect(next).toHaveCount(0)
  await page.goto('/?q=sem-resultados-xyz')
  await expect(page.getByText('Nenhum NFT encontrado.', { exact: true })).toBeVisible()
  await expect(pagination).toHaveCount(0)
})

test('mais desta coleção troca página por teclado e abre outro NFT', async ({ page }) => {
  await page.goto('/nfts/1')
  const carousel = page.getByRole('region', { name: 'Mais desta coleção' })
  const secondPage = carousel.getByRole('button', { name: 'Ver coleção 2' })
  await secondPage.focus()
  await secondPage.press('Enter')
  await expect(secondPage).toHaveAttribute('aria-current', 'true')
  const card = carousel.getByRole('link').first()
  const destination = await card.getAttribute('href')
  await card.click()
  await expect(page).toHaveURL(new RegExp(`${destination}$`))
})
