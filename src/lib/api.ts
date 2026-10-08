import axios, { AxiosError } from 'axios'

import type { ApiError } from '../contracts'

export const api = axios.create({ baseURL: '/api', timeout: 8000 })

api.interceptors.response.use(
  async (response) => {
    const contentType = String(response.headers['content-type'] ?? '')
    if (!contentType.includes('application/json')) {
      const config = response.config as typeof response.config & { mocksRecovered?: boolean }
      // Um worker suspenso deixa o Vite devolver o HTML da SPA para /api.
      // Repetimos somente leituras; uma compra nunca é reenviada aqui.
      if (
        import.meta.env.VITE_ENABLE_MOCKS !== 'false' &&
        contentType.includes('text/html') &&
        config.method === 'get' &&
        !config.mocksRecovered
      ) {
        config.mocksRecovered = true
        const { restartMocks } = await import('../mocks/browser')
        await restartMocks()
        return api.request(config)
      }
      throw new AxiosError(
        'A API retornou uma resposta inválida.',
        'INVALID_RESPONSE',
        response.config,
        response.request,
        { ...response, data: { message: 'Falha ao atualizar os dados. Tente novamente.' } },
      )
    }
    return response
  },
  (error) => {
    if (import.meta.env.DEV && error.code !== 'ERR_CANCELED') {
      console.warn(
        '[API]',
        error.config?.method,
        String(error.config?.url ?? '').split('?')[0],
        error.response?.status ?? 'sem resposta',
        error.code,
      )
    }
    if (error.response?.status === 401 && error.response?.data?.code === 'SESSION_INVALID') {
      window.dispatchEvent(new Event('kurio.session-expired'))
    }
    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown) {
  return error instanceof AxiosError
    ? ((error.response?.data as ApiError)?.message ?? 'Falha de conexão. Tente novamente.')
    : 'Não foi possível concluir a operação.'
}
