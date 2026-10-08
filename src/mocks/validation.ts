import { HttpResponse } from 'msw'

export const secondaryAddressValid = (value: unknown, network: string) =>
  typeof value === 'string' &&
  value.length <= 100 &&
  (value === '' ||
    /^\S+\.eth$/.test(value) ||
    (network === 'Solana' ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ : /^0x[a-fA-F0-9]{40}$/).test(value))
export const error = (
  message: string,
  status = 422,
  code = 'VALIDATION',
  fields?: Record<string, string>,
) => HttpResponse.json({ code, message, fields }, { status })
export const emailValid = (value: unknown) =>
  typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
export const textValid = (value: unknown, max = 100) =>
  typeof value === 'string' && Boolean(value.trim()) && value.length <= max
export const unauthorized = () =>
  error('Sua sessão expirou. Entre novamente.', 401, 'SESSION_INVALID')

export async function body(request: Request): Promise<Record<string, unknown>> {
  const data = await request.json().catch(() => ({}))
  return data && typeof data === 'object' && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : {}
}
