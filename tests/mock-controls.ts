import type { Page } from '@playwright/test'

export async function selectScenario(page: Page, scenario: string) {
  await page.evaluate(async (value) => {
    const response = await fetch('/api/demo/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: value }),
    })
    if (!response.ok) throw new Error('Não foi possível selecionar o cenário.')
  }, scenario)
  await page.reload()
}

export async function emitNftEvent(
  page: Page,
  kind: 'update' | 'old' | 'duplicate' | 'stock',
  id = '1',
) {
  await page.waitForFunction(async () => {
    const path = '/src/mocks/events.ts'
    const { nftListeners } = await import(path)
    return nftListeners.size > 0
  })
  await page.evaluate(
    async ({ kind, id }) => {
      const storePath = '/src/mocks/store.ts'
      const eventsPath = '/src/mocks/events.ts'
      const moneyPath = '/src/lib/money.ts'
      const { store, save } = await import(storePath)
      const { nftListeners } = await import(eventsPath)
      const { fromWei, toWei } = await import(moneyPath)
      const nft = store().nfts.find((item: { id: string }) => item.id === id)
      if (!nft) throw new Error('NFT não encontrado para o teste.')
      if (kind === 'update' || kind === 'stock') {
        if (kind === 'stock') nft.available = 0
        else nft.price = fromWei(toWei(nft.price) + toWei('0.1'))
        nft.version += 1
        save()
      }
      const event = {
        eventId: crypto.randomUUID(),
        nft: kind === 'old' ? { ...nft, version: 0, price: '0.01' } : structuredClone(nft),
      }
      // Usa o servidor mock existente, que entrega o evento pelo Socket.IO da aplicação.
      for (const listener of nftListeners) {
        listener(event)
        if (kind === 'duplicate') listener(event)
      }
    },
    { kind, id },
  )
}

export async function interruptRealtime(page: Page) {
  await page.evaluate(async () => {
    const path = '/src/mocks/handlers.ts'
    const { realtime } = await import(path)
    if (!realtime.clients.size) throw new Error('Nenhuma conexão ativa para interromper.')
    for (const client of realtime.clients) client.close(1011, 'Interrupção simulada')
  })
}

export async function emitOldOrder(page: Page) {
  await page.evaluate(async () => {
    const storePath = '/src/mocks/store.ts'
    const eventsPath = '/src/mocks/events.ts'
    const { store } = await import(storePath)
    const { orderListeners } = await import(eventsPath)
    const order = Object.values(store().orders).at(-1) as { userId: string }
    if (!order) throw new Error('Nenhum pedido para o teste.')
    const event = {
      eventId: crypto.randomUUID(),
      userId: order.userId,
      order: { ...structuredClone(order), version: 0, status: 'pending' },
    }
    for (const listener of orderListeners) listener(event)
  })
}
