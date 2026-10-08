import { test, expect, type Page } from '@playwright/test'
import { clickDemo, selectScenario } from './demo-controls'

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-06T12:00:00Z'))
})

async function login(page: Page, email = 'ana@kurio.test', password = 'Kurio123!') {
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(page).not.toHaveURL(/\/login/)
  await expect(page.getByRole('banner').getByRole('button', { name: 'Meu perfil' })).toBeVisible()
}

async function preparePurchase(page: Page) {
  // Estoque e edição reproduzíveis neste fluxo; o app continua aleatório.
  await page.addInitScript(() => {
    Math.random = () => 0.5
  })
  await page.goto('/nfts/1')
  await page.locator('.purchase-primary').click()
  await expect(page.getByRole('status').filter({ hasText: 'Adicionado' })).toBeVisible()
  await login(page)
  await page.goto('/wallets')
  await page.getByLabel('Apelido da carteira').fill('Carteira de teste')
  await page.getByLabel('Nome do perfil').fill('Perfil de teste')
  await page.getByLabel('ENS ou carteira secundária (opcional)').fill('backup.eth')
  await page.getByLabel('Endereço da carteira').fill('0x1111111111111111111111111111111111111111')
  await page.getByLabel('Código de indicação').fill('JUNGLE')
  await page.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Carteira salva' })).toBeVisible()
  await page.goto('/checkout')
  await expect(page.locator('.payment-wallets input:checked')).not.toHaveValue('')
  await expect(page.getByLabel('Nome do perfil')).toHaveValue('Perfil de teste')
  await expect(page.getByLabel('Código de indicação')).toHaveValue('JUNGLE')
  await expect(page.getByLabel('ENS ou carteira secundária (opcional)')).toHaveValue('backup.eth')
  await page.getByRole('button', { name: 'Conectar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled()
}

test('cupom no pagamento recalcula sem navegar ou apagar o formulário', async ({ page }) => {
  await preparePurchase(page)
  const notes = page.getByLabel('Observação do colecionador (opcional)')
  await notes.fill('Preservar estes dados')
  await page.getByRole('button', { name: 'Tem um código promocional? Aplique aqui' }).click()
  await expect(
    page.getByRole('button', { name: 'Tem um código promocional? Aplique aqui' }),
  ).toBeHidden()
  const coupon = page.getByLabel('Código promocional')
  await coupon.fill('INVALIDO')
  await page.getByRole('button', { name: 'Aplicar cupom' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Cupom inválido' })).toBeVisible()
  await coupon.fill('KURIO10')
  await coupon.press('Enter')
  await expect(page.locator('.summary')).toContainText('0.8728 ETH')
  await expect(page).toHaveURL(/\/checkout$/)
  await expect(notes).toHaveValue('Preservar estes dados')
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled()
  await page.getByRole('button', { name: 'Remover cupom' }).click()
  await expect(coupon).toBeHidden()
  await expect(
    page.getByRole('button', { name: 'Tem um código promocional? Aplique aqui' }),
  ).toBeVisible()
  await expect(page.locator('.summary')).toContainText('0.968 ETH')
  await expect(notes).toHaveValue('Preservar estes dados')
})

test('compra completa, carrinho do visitante e recibo após refresh', async ({ page }) => {
  await preparePurchase(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('dialog')).toContainText('Processando pagamento')
  await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeVisible()
  await expect(page.locator('.summary')).toContainText('0.968 ETH')
  const receiptUrl = page.url()
  await expect(page.getByRole('dialog')).toContainText('Seus NFTs agora estão na sua carteira')
  await expect(page.getByRole('dialog')).toContainText('MetaMask')
  await expect(page.getByRole('dialog')).toContainText('06/10/2026')
  await page.getByRole('button', { name: 'Fechar recibo' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await clickDemo(page, 'Evento antigo de pedido')
  await expect(page.locator('.demo-panel [role="status"]')).toContainText(
    'Estado mantido: confirmado',
  )
  await clickDemo(page, 'Simular mudança de preço')
  await expect(page.locator('.demo-panel [role="status"]')).toContainText('1.052 ETH')
  await page.goto(receiptUrl)
  await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeVisible()
  await expect(page.locator('.summary')).toContainText('0.968 ETH')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeVisible()
  await page.goto('/cart')
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
})

test('cadastro rejeita confirmação diferente pela API', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Nome de usuário').fill('pessoa_teste')
  await page.getByLabel('E-mail', { exact: true }).fill('pessoa@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByLabel('Confirmar senha', { exact: true }).fill('Diferente123!')
  await page.getByRole('button', { name: /^Criar (conta|perfil)$/, exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('confirmação da senha não corresponde')
  await expect(page.getByLabel('E-mail', { exact: true })).toHaveValue('pessoa@kurio.test')
})

test('campos da carteira são validados pela API antes de criar pedido', async ({ page }) => {
  await preparePurchase(page)
  const walletId = await page.locator('.payment-wallets input:checked').inputValue()
  const result = await page.evaluate(async (id) => {
    const quote = await (
      await fetch('/api/quote', { method: 'POST', body: JSON.stringify({ coupon: '' }) })
    ).json()
    const collector = Object.fromEntries(
      new FormData(document.querySelector<HTMLFormElement>('form.checkout-layout')!),
    )
    collector.secondaryAddress = 'endereço inválido'
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ quoteId: quote.id, walletId: id, collector }),
    })
    return {
      status: response.status,
      error: await response.json(),
      count: Object.keys(JSON.parse(localStorage.getItem('kurio.mock.v1')!).orders).length,
    }
  }, walletId)
  expect(result.status).toBe(422)
  expect(result.error.fields.secondaryAddress).toContain('ENS')
  expect(result.count).toBe(0)
  await page.getByLabel('Código de indicação').fill('')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  expect(
    await page
      .getByLabel('Código de indicação')
      .evaluate((element: HTMLInputElement) => element.validity.valueMissing),
  ).toBe(true)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('carteira secundária, edição e conexão recusada ou desconectada', async ({ page }) => {
  await preparePurchase(page)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Simular recusa' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Conexão recusada' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Conectar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Desconectar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeDisabled()
  await page.goto('/wallets')
  await page
    .locator('.secondary-wallet')
    .getByRole('button', { name: 'Adicionar', exact: true })
    .click()
  await page.getByLabel('Apelido da carteira').fill('Secundária')
  await page.getByLabel('Nome do perfil').fill('Perfil secundário')
  await page.getByLabel('Endereço da carteira').fill('0x2222222222222222222222222222222222222222')
  await page.getByLabel('Carteira principal', { exact: true }).uncheck()
  await page.getByLabel('Código de indicação').fill('JUNGLE')
  await page.getByRole('button', { name: 'Salvar carteira', exact: true }).click()
  await expect(page.locator('.wallet-item')).toHaveCount(1)
  await page.locator('.wallet-item').last().getByRole('button', { name: 'Editar carteira' }).click()
  await page.getByLabel('Apelido da carteira').fill('Secundária editada')
  await page.getByLabel('Carteira principal', { exact: true }).check()
  await page.getByLabel('Código de indicação').fill('JUNGLE')
  await page.getByRole('button', { name: 'Salvar carteira', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Carteira principal', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.locator('.wallet-item')).toHaveCount(1)

  await expect(page.getByLabel('Apelido da carteira')).toHaveValue('Secundária editada')
  await expect(page.getByLabel('Nome do perfil')).toHaveValue('Perfil secundário')
  await expect(page.getByLabel('Código de indicação')).toHaveValue('JUNGLE')
  await expect(page.getByLabel('Carteira principal', { exact: true })).toBeChecked()
  await page.goto('/checkout')
  await expect(page.locator('.payment-wallets label:has(input:checked)')).toContainText('0x222222')
  await expect(page.getByLabel('Nome do perfil')).toHaveValue('Perfil secundário')
  await page.getByLabel('Usar outra carteira?').check()
  await expect(page.getByLabel('Endereço da carteira')).toHaveValue(
    '0x1111111111111111111111111111111111111111',
  )
  await page.getByLabel('Usar outra carteira?').uncheck()
  const primaryId = await page.locator('.payment-wallets input:checked').inputValue()
  await page.locator('.payment-wallets input:not(:checked)').first().check()
  const otherId = await page.locator('.payment-wallets input:checked').inputValue()
  expect(otherId).not.toBe(primaryId)
  await clickDemo(page, 'Interromper conexão')
  await clickDemo(page, 'Reconectar')
  await expect(page.locator('.payment-wallets input:checked')).toHaveValue(otherId)
  await page.reload()
  await expect(page.locator('.payment-wallets input:checked')).toHaveValue(primaryId)
})

test('expiração no checkout preserva carrinho e retorna ao pagamento', async ({ page }) => {
  await preparePurchase(page)
  await page.keyboard.press('Escape')
  await selectScenario(page, 'expired')
  await expect(page.getByRole('dialog', { name: 'Entrar na Kurio' })).toBeVisible()
  await expect(page).toHaveURL(/\/checkout$/)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Entrar e retomar' }).click()
  await expect(page).toHaveURL(/\/checkout$/)
  await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('dialog').getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/checkout$/)
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page.locator('.summary')).toContainText('0.968 ETH')
})

test('falha ao abrir rota privada tem feedback e permite nova tentativa', async ({ page }) => {
  await login(page)
  await selectScenario(page, 'offline')
  await page.getByRole('button', { name: 'Meu perfil', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Não foi possível abrir esta página' }),
  ).toBeVisible()
  await selectScenario(page, 'success')
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
})

test('cotação desatualizada exige revisão', async ({ page }) => {
  await preparePurchase(page)
  await clickDemo(page, 'Simular mudança de preço')
  await expect(page.locator('.summary')).toContainText('1.306 ETH')
})

test('favorito otimista faz rollback e recupera', async ({ page }) => {
  await login(page)
  await page.goto('/nfts/1')
  await expect(page.getByRole('button', { name: 'Favoritar' })).toBeEnabled()
  await page.evaluate(async () => {
    await fetch('/api/demo/scenario', {
      method: 'POST',
      body: JSON.stringify({ scenario: 'favorite-error' }),
    })
  })
  await page.getByRole('button', { name: 'Favoritar' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Falha transitória' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Favoritar' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await page.evaluate(async () => {
    await fetch('/api/demo/scenario', {
      method: 'POST',
      body: JSON.stringify({ scenario: 'success' }),
    })
  })
  await page.getByRole('button', { name: 'Favoritar' }).click()
  await expect(page.getByRole('button', { name: 'Favoritado' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.reload()
  await expect(page.getByRole('button', { name: 'Favoritado' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('banner').getByRole('button', { name: 'Meu perfil' }).click()
  await page.locator('.account-menu').getByRole('button', { name: 'Sair', exact: true }).click()
  await login(page, 'leo@kurio.test')
  await page.goto('/nfts/1')
  await expect(page.getByRole('button', { name: 'Favoritar' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
})

test('recusa preserva carrinho e isolamento entre usuários', async ({ page }) => {
  await preparePurchase(page)
  await page.evaluate(async () => {
    await fetch('/api/demo/scenario', {
      method: 'POST',
      body: JSON.stringify({ scenario: 'declined' }),
    })
  })
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
  const orderUrl = page.url()
  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await page.getByRole('banner').getByRole('button', { name: 'Meu perfil' }).click()
  await page.locator('.account-menu').getByRole('button', { name: 'Sair', exact: true }).click()
  await login(page, 'leo@kurio.test')
  await page.goto(orderUrl)
  await expect(page.getByRole('alert').filter({ hasText: 'Acesso negado' })).toBeVisible()
})

test('timeout recupera mesmo pedido, sem segunda compra', async ({ page }) => {
  await preparePurchase(page)
  await page.evaluate(async () => {
    await fetch('/api/demo/scenario', {
      method: 'POST',
      body: JSON.stringify({ scenario: 'timeout' }),
    })
  })
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.locator('#checkout-error')).toContainText('Falha de conexão', {
    timeout: 12_000,
  })
  await page.reload()
  await page.getByRole('button', { name: 'Recuperar pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeVisible()
  const count = await page.evaluate(async () => {
    const state = JSON.parse(localStorage.getItem('kurio.mock.v1')!)
    return Object.keys(state.orders).length
  })
  expect(count).toBe(1)
})

test('perfil, senha, carteira e validação persistem', async ({ page }) => {
  await login(page)
  await page.goto('/profile')
  await page.getByLabel('Nome de exibição', { exact: true }).fill('Ana Colecionadora')
  await page.getByLabel('Avatar', { exact: true }).setInputFiles('public/assets/nft-2.webp')
  await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Perfil salvo' })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Nome de exibição', { exact: true })).toHaveValue(
    'Ana Colecionadora',
  )
  await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()
  await page.getByLabel('Senha atual', { exact: true }).fill('Errada123!')
  await page.getByLabel('Nova senha', { exact: true }).fill('Nova12345!')
  await page.getByLabel('Confirmar nova senha', { exact: true }).fill('Nova12345!')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Senha atual incorreta' })).toBeVisible()
  await page.getByLabel('Senha atual', { exact: true }).fill('Kurio123!')
  await page.getByLabel('Nova senha', { exact: true }).fill('Nova12345!')
  await page.getByLabel('Confirmar nova senha', { exact: true }).fill('Nova12345!')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Perfil salvo.' })).toBeVisible()
  await page.goto('/wallets')
  await page.getByLabel('Apelido da carteira').fill('Carteira inválida')
  await page.getByLabel('Endereço da carteira').fill('invalido')
  await page.getByLabel('Código de indicação').fill('JUNGLE')
  await page.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(
    page.getByRole('alert').filter({ hasText: 'Endereço ou rede inválidos' }),
  ).toBeVisible()
  await page.getByRole('banner').getByRole('button', { name: 'Meu perfil' }).click()
  await page.locator('.account-menu').getByRole('button', { name: 'Sair', exact: true }).click()
  await login(page, 'ana@kurio.test', 'Nova12345!')
  await page.goto('/profile')
  await expect(page.getByLabel('Nome de exibição', { exact: true })).toHaveValue(
    'Ana Colecionadora',
  )
})

test('falha de sessão em atualização automática preserva formulário e recupera', async ({
  page,
}) => {
  await login(page)
  await page.goto('/profile')
  await page.getByLabel('Nome de exibição', { exact: true }).fill('Edição preservada')
  await page.evaluate(async () => {
    await fetch('/api/demo/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'server-error' }),
    })
  })
  await page.clock.fastForward(31_000)
  await expect(
    page.getByRole('alert').filter({ hasText: 'Não foi possível atualizar a sessão' }),
  ).toBeVisible()
  await expect(page.getByLabel('Nome de exibição', { exact: true })).toHaveValue(
    'Edição preservada',
  )
  await page.evaluate(async () => {
    await fetch('/api/demo/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'success' }),
    })
  })
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await expect(
    page.getByRole('alert').filter({ hasText: 'Não foi possível atualizar a sessão' }),
  ).toHaveCount(0)
  await expect(page.getByLabel('Nome de exibição', { exact: true })).toHaveValue(
    'Edição preservada',
  )
})

test('falha temporária no acesso privado permite tentar novamente na mesma rota', async ({
  page,
}) => {
  await login(page)
  await page.evaluate(async () => {
    await fetch('/api/demo/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'server-error' }),
    })
  })
  await page.goto('/profile')
  await expect(page.getByRole('alert')).toContainText('Serviço temporariamente indisponível')
  await expect(
    page.getByRole('heading', { name: 'Não foi possível abrir esta página' }),
  ).toHaveCount(0)
  await page.evaluate(async () => {
    await fetch('/api/demo/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'success' }),
    })
  })
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await expect(page.getByLabel('Nome de exibição', { exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/profile$/)
})

test('cadastro com conflito e sessão expirada retoma contexto', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Nome de usuário').fill('nova_pessoa')
  await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByLabel('Confirmar senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: /^Criar (conta|perfil)$/, exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('já cadastrado')
  await page.getByLabel('E-mail', { exact: true }).fill('nova@kurio.test')
  await page.getByRole('button', { name: /^Criar (conta|perfil)$/, exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Entrar', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await login(page, 'nova@kurio.test')
  await page.goto('/profile')
  await expect(page.getByLabel('Nome de exibição', { exact: true })).toHaveValue('nova_pessoa')
  await selectScenario(page, 'expired')
  await expect(page.getByRole('dialog', { name: 'Entrar na Kurio' })).toBeVisible()
  await expect(page).toHaveURL(/\/profile$/)
  await page.getByLabel('E-mail', { exact: true }).fill('nova@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(page).toHaveURL(/\/profile/)
})

test('acesso privado direto mantém a rota durante login em modal', async ({ page }) => {
  await page.goto('/profile')
  await expect(page.getByRole('dialog', { name: 'Entrar na Kurio' })).toBeVisible()
  await expect(page).toHaveURL(/\/profile$/)
  await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('dialog').getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveURL(/\/profile$/)
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
})

test('cupom, quantidade e carrinho persistem após refresh', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.5
  })
  await page.goto('/nfts/1')
  const count = page.getByRole('banner').locator('.cart-count')
  await expect(count).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Diminuir quantidade' })).toBeDisabled()
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(page.getByLabel('Quantidade', { exact: true })).toHaveText('2')
  await page.locator('.purchase-primary').click()
  await expect(page.getByRole('status').filter({ hasText: 'Adicionado' })).toBeVisible()
  await expect(count).toHaveText('2')
  await page.goto('/cart')
  await page.getByLabel('Código promocional').fill('EXPIRED')
  await page.getByRole('button', { name: 'Aplicar cupom' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Cupom expirado' })).toBeVisible()
  await page.getByLabel('Código promocional').fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar cupom' }).click()
  await expect(page.locator('.summary')).toContainText('1.7296 ETH')
  await page.reload()
  await expect(page.locator('.cart-row output')).toHaveText('2')
  await expect(page.locator('.summary')).toContainText('1.7296 ETH')
  await page.getByRole('button', { name: 'Remover Emerald Ape #042' }).click()
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
  await expect(count).toHaveCount(0)
})

test('eventos antigos, esgotamento e foco do diálogo', async ({ page }) => {
  await preparePurchase(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await clickDemo(page, 'Simular mudança de preço')
  await expect(page.getByRole('status').filter({ hasText: 'Preço atualizado' })).toContainText(
    '1.29',
  )
  await clickDemo(page, 'Evento duplicado')
  await clickDemo(page, 'Evento antigo')
  await clickDemo(page, 'Interromper conexão')
  await clickDemo(page, 'Reconectar')
  await expect(page.getByText('Socket.IO: conectado')).toBeVisible()
  await clickDemo(page, 'Simular esgotamento')
  await expect(page.getByRole('alert').filter({ hasText: 'estoque suficiente' })).toBeVisible()
})

test('visual: início e detalhe', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('status').filter({ hasText: '36 resultados' })).toBeVisible()
  await expect(page.getByText('Socket.IO: conectado')).toBeVisible()
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect(page).toHaveScreenshot('home.png', { fullPage: true })
  await page.goto('/nfts/1')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page.getByText('Socket.IO: conectado')).toBeVisible()
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect(page).toHaveScreenshot('detail.png', { fullPage: true })
})

test('carrossel do carrinho troca páginas por teclado e abre o NFT', async ({ page }, testInfo) => {
  await page.goto('/cart')
  const carousel = page.getByRole('region', { name: 'Colecionadores também viram' })
  await expect(carousel.getByRole('link')).toHaveCount(testInfo.project.name === 'mobile' ? 2 : 5)
  const secondPage = carousel.getByRole('button', { name: 'Ver recomendações 2' })
  await secondPage.focus()
  await page.keyboard.press('Enter')
  await expect(secondPage).toHaveAttribute('aria-current', 'true')
  expect(
    await carousel.locator('.recommendations-track').evaluate((element) => element.scrollLeft),
  ).toBeGreaterThan(0)
  const card = carousel.locator('.recommendations-page').nth(1).getByRole('link').first()
  const destination = await card.getAttribute('href')
  const name = await card.locator('h3').innerText()
  await card.click()
  await expect(page).toHaveURL(new RegExp(`${destination}$`))
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
})

test('evento durante revisão impede cotação antiga e compra duplicada', async ({ page }) => {
  await preparePurchase(page)
  await expect(page.locator('.summary')).toContainText('0.968 ETH')
  await clickDemo(page, 'Atualizar preço em 2s')
  await page.evaluate(async () => {
    await fetch('/api/demo/scenario', {
      method: 'POST',
      body: JSON.stringify({ scenario: 'slow' }),
    })
  })
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.locator('#checkout-error')).toContainText('Revise novamente', {
    timeout: 10000,
  })
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.demo-panel [role="status"]')).toContainText('1.052 ETH')
  await expect(page.locator('.summary')).toContainText('1.306 ETH')
  await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toHaveCount(0)
  await selectScenario(page, 'success')
  await page.getByRole('button', { name: 'Confirmar compra' }).click({ clickCount: 2 })
  await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeVisible()
  const count = await page.evaluate(
    () => Object.keys(JSON.parse(localStorage.getItem('kurio.mock.v1')!).orders).length,
  )
  expect(count).toBe(1)
})

test('pedido pendente recupera após interrupção e refresh', async ({ page }) => {
  await preparePurchase(page)
  await page.keyboard.press('Escape')
  await clickDemo(page, 'Interromper conexão')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('dialog')).toContainText('Processando pagamento')
  await expect(page.getByRole('heading', { name: 'Pedido pendente' })).toBeVisible()
  const url = page.url()
  await page.reload()
  await expect(page).toHaveURL(url)
  await expect(page.getByRole('dialog')).toContainText('Seus NFTs agora estão na sua carteira')
  await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeVisible()
})

test('tablet e teclado não perdem conteúdo', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.goto('/')
  await expect(page.getByRole('status').filter({ hasText: '36 resultados' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'KURIO' })).toBeFocused()
})

test('visual: carrinho e pagamento', async ({ page }) => {
  await preparePurchase(page)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect(page).toHaveScreenshot('checkout.png', { fullPage: true })
  await page.goto('/cart')
  await expect(page.locator('.summary')).toContainText('0.968 ETH')
  await expect(page.getByText('Socket.IO: conectado')).toBeVisible()
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect(page).toHaveScreenshot('cart.png', { fullPage: true })
})

test('botão do topo muda de entrar para meu perfil e sair fica no menu da conta', async ({
  page,
}) => {
  await login(page)
  const header = page.getByRole('banner')
  await expect(header.getByRole('button', { name: 'Entrar', exact: true })).toHaveCount(0)
  await expect(header.getByRole('button', { name: 'Sair', exact: true })).toHaveCount(0)
  await header.getByRole('button', { name: 'Meu perfil', exact: true }).click()
  await expect(page).toHaveURL(/\/profile$/)
  await page.locator('.account-menu').getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(header.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
})

test('preço promocional é usado na cotação e cupom acumula sobre o subtotal', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.5
  })
  await page.goto('/nfts/1')
  await expect(page.locator('.detail-layout .price')).toContainText('0.952 ETH')
  await expect(page.locator('.detail-layout .price-discount')).toContainText('1.19 ETH')
  await page.locator('.purchase-primary').click()
  await expect(page.getByRole('status').filter({ hasText: 'Adicionado' })).toBeVisible()
  const quote = await page.evaluate(async () => {
    const response = await fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coupon: 'KURIO10' }),
    })
    return response.json()
  })
  expect(quote.subtotal).toBe('0.952')
  expect(quote.discount).toBe('0.0952')
  expect(quote.total).toBe('0.8728')
})
