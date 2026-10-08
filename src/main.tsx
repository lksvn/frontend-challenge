import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@fontsource/roboto-mono/latin-400.css'
import '@fontsource/roboto-mono/latin-500.css'
import '@fontsource/roboto-mono/latin-600.css'
import '@fontsource/roboto-mono/latin-700.css'
import './styles.css'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
    mutations: { retry: false },
  },
})

window.addEventListener('kurio.session-expired', () => {
  queryClient.setQueryData(['session'], null)
  for (const key of ['favorites', 'wallets', 'order', 'profile', 'cart', 'quote']) {
    void queryClient.cancelQueries({ queryKey: [key] })
    queryClient.removeQueries({ queryKey: [key] })
  }
})

async function start() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
    const { worker } = await import('./mocks/browser')
    await worker.start({
      serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
      onUnhandledRequest: 'bypass',
      quiet: true,
    })
  }
  const [{ RouterProvider }, { router }] = await Promise.all([
    import('@tanstack/react-router'),
    import('./router'),
  ])
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </React.StrictMode>,
  )
}

start().catch(() => {
  document.getElementById('root')!.textContent =
    'Não foi possível iniciar a aplicação. Recarregue a página.'
})
