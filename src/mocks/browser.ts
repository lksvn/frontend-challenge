import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { accountHandlers } from './account-handlers'
import { commerceHandlers } from './commerce-handlers'
import { walletHandlers } from './wallet-handlers'
import { ready } from './store'
import { store } from './store'
import { delay, http, HttpResponse } from 'msw'

await ready
const network = http.all('/api/*', async ({ request }) => {
  if (new URL(request.url).pathname.startsWith('/api/demo')) return
  const scenario = store().scenario
  if (scenario === 'slow') await delay(2000)
  if (scenario === 'variable')
    await delay(((new URL(request.url).searchParams.get('q')?.length ?? 0) % 4) * 400)
  if (scenario === 'offline') return HttpResponse.error()
  if (scenario === 'server-error')
    return HttpResponse.json(
      { code: 'TRANSIENT', message: 'Serviço temporariamente indisponível.' },
      { status: 503 },
    )
})
export const worker = setupWorker(
  network,
  ...accountHandlers,
  ...walletHandlers,
  ...commerceHandlers,
  ...handlers,
)

// O worker ativo mantém os handlers antigos; recarregar aplica as mudanças dos mocks.
if (import.meta.hot) {
  import.meta.hot.accept(() => window.location.reload())
}

let recovery: Promise<void> | undefined

export function restartMocks() {
  if (!recovery) {
    worker.stop()
    recovery = worker
      .start({
        serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
        onUnhandledRequest: 'bypass',
        quiet: true,
      })
      .then(() => undefined)
      .finally(() => {
        recovery = undefined
      })
  }
  return recovery
}
