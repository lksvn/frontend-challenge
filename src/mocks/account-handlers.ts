import { http, HttpResponse } from 'msw'
import { hashPassword, publicUser, ready, reset, save, store, user } from './store'
import { demoState } from './scenarios'
import { body, error, unauthorized, emailValid, textValid } from './validation'

export const accountHandlers = [
  http.get('/api/demo/state', () => HttpResponse.json(demoState())),
  http.post('/api/demo/reset', async ({ request }) => {
    const data = (await request.json().catch(() => ({}))) as Record<string, unknown>
    await reset(String(data.scenario ?? 'success'))
    return HttpResponse.json({ ok: true })
  }),
  http.post('/api/demo/scenario', async ({ request }) => {
    const scenario = (await body(request)).scenario
    if (!demoState().scenarios.some((item) => item.id === scenario))
      return error('Cenário inválido.')
    store().scenario = String(scenario)
    if (store().scenario === 'expired' && store().session) store().session!.expiresAt = 0
    save()
    return HttpResponse.json(demoState())
  }),
  http.get('/api/session', async () => {
    await ready
    return HttpResponse.json(user() ? publicUser(user()!) : null)
  }),
  http.post('/api/login', async ({ request }) => {
    await ready
    const data = await body(request)
    const account = store().accounts.find((item) => item.email === data.email)
    if (
      !account ||
      (await hashPassword(String(data.password), account.salt)) !== account.passwordHash
    )
      return error('E-mail ou senha incorretos.', 401)
    store().session = { userId: account.id, expiresAt: Date.now() + 30 * 60_000 }
    const existing = store().carts[account.id] ?? []
    for (const guest of store().carts.guest ?? []) {
      const same = existing.find(
        (item) => item.nft.id === guest.nft.id && item.edition === guest.edition,
      )
      if (same) same.quantity = Math.min(same.quantity + guest.quantity, guest.nft.available)
      else existing.push(guest)
    }
    store().carts[account.id] = existing
    store().carts.guest = []
    save()
    return HttpResponse.json(publicUser(account))
  }),
  http.post('/api/register', async ({ request }) => {
    const data = await body(request)
    const fields: Record<string, string> = {}
    if (!textValid(data.name)) fields.name = 'Informe seu nome (até 100 caracteres).'
    if (typeof data.username !== 'string' || !/^[a-zA-Z0-9_]{3,30}$/.test(data.username))
      fields.username = 'Usuário deve ter de 3 a 30 letras, números ou _.'
    if (!emailValid(data.email)) fields.email = 'Informe um e-mail válido.'
    if (typeof data.password !== 'string' || data.password.length < 8 || data.password.length > 128)
      fields.password = 'Senha deve ter entre 8 e 128 caracteres.'
    if (data.confirm !== data.password) fields.confirm = 'A confirmação da senha não corresponde.'
    if (Object.keys(fields).length)
      return error(Object.values(fields).join(' '), 422, 'VALIDATION', fields)
    if (
      store().accounts.some(
        (account) => account.email === data.email || account.username === data.username,
      )
    )
      return error('E-mail ou usuário já cadastrado.', 409, 'CONFLICT', {
        email: 'Confira e-mail e usuário.',
        username: 'Confira e-mail e usuário.',
      })
    const salt = crypto.randomUUID()
    const account = {
      id: crypto.randomUUID(),
      name: String(data.name),
      username: String(data.username),
      email: String(data.email),
      avatar: '',
      salt,
      passwordHash: await hashPassword(String(data.password), salt),
    }
    store().accounts.push(account)
    save()
    return HttpResponse.json(publicUser(account), { status: 201 })
  }),
  http.post('/api/logout', () => {
    store().session = null
    save()
    return HttpResponse.json({ ok: true })
  }),
  http.get('/api/profile', () =>
    user() ? HttpResponse.json(publicUser(user()!)) : unauthorized(),
  ),
  http.patch('/api/profile', async ({ request }) => {
    const account = user()
    if (!account) return unauthorized()
    const data = await body(request)
    if (
      !textValid(data.name) ||
      typeof data.username !== 'string' ||
      !/^[a-zA-Z0-9_]{3,30}$/.test(data.username)
    )
      return error(
        'Nome obrigatório e usuário com 3 a 30 letras, números ou _.',
        422,
        'VALIDATION',
        { name: 'Confira seu nome.', username: 'Confira o nome de usuário.' },
      )
    if (store().accounts.some((item) => item.id !== account.id && item.username === data.username))
      return error('Usuário já utilizado.', 409, 'CONFLICT', { username: 'Usuário já utilizado.' })
    if (
      data.avatar &&
      (!/^data:image\/(png|jpeg|webp);base64,/.test(String(data.avatar)) ||
        String(data.avatar).length > 700_000)
    )
      return error('Avatar inválido.', 422, 'VALIDATION', { avatar: 'Avatar inválido.' })
    if (data.email !== undefined) {
      if (!emailValid(data.email))
        return error('E-mail inválido.', 422, 'VALIDATION', { email: 'E-mail inválido.' })
      if (store().accounts.some((item) => item.id !== account.id && item.email === data.email))
        return error('E-mail já utilizado.', 409, 'CONFLICT', { email: 'E-mail já utilizado.' })
    }
    if (data.ens !== undefined && (typeof data.ens !== 'string' || !/^\S+\.eth$/.test(data.ens)))
      return error('Nome ENS deve terminar em .eth.', 422, 'VALIDATION', {
        ens: 'Nome ENS deve terminar em .eth.',
      })
    if (data.walletNickname !== undefined && !textValid(data.walletNickname))
      return error('Informe um apelido de até 100 caracteres para a carteira.', 422, 'VALIDATION', {
        walletNickname: 'Informe um apelido de até 100 caracteres.',
      })
    Object.assign(account, {
      name: String(data.name),
      username: String(data.username),
      avatar: String(data.avatar ?? account.avatar),
      ens: String(data.ens ?? account.ens ?? 'colecionador.eth'),
      walletNickname: String(data.walletNickname ?? account.walletNickname ?? 'Minha carteira'),
      email: String(data.email ?? account.email),
    })
    save()
    return HttpResponse.json(publicUser(account))
  }),
  http.post('/api/profile/password', async ({ request }) => {
    const account = user()
    if (!account) return unauthorized()
    const data = await body(request)
    if ((await hashPassword(String(data.current), account.salt)) !== account.passwordHash)
      return error('Senha atual incorreta.', 422, 'VALIDATION', {
        current: 'Senha atual incorreta.',
      })
    if (typeof data.password !== 'string' || data.password.length < 8 || data.password.length > 128)
      return error('A nova senha precisa de 8 a 128 caracteres.', 422, 'VALIDATION', {
        password: 'A nova senha precisa de 8 a 128 caracteres.',
      })
    if (data.confirm !== data.password)
      return error('A confirmação da senha não corresponde.', 422, 'VALIDATION', {
        confirm: 'A confirmação da senha não corresponde.',
      })
    account.salt = crypto.randomUUID()
    account.passwordHash = await hashPassword(String(data.password), account.salt)
    save()
    return HttpResponse.json({ ok: true })
  }),
  http.get('/api/favorites', () =>
    user() ? HttpResponse.json(store().favorites[user()!.id] ?? []) : unauthorized(),
  ),
  http.put('/api/favorites/:id', ({ params }) => {
    if (!user()) return unauthorized()
    if (store().scenario === 'favorite-error')
      return error('Falha transitória. Tente novamente.', 503)
    const favorites = store().favorites[user()!.id] ?? []
    const id = String(params.id)
    if (!store().nfts.some((nft) => nft.id === id))
      return error('NFT não encontrado.', 404, 'NOT_FOUND')
    store().favorites[user()!.id] = favorites.includes(id)
      ? favorites.filter((item) => item !== id)
      : [...favorites, id]
    save()
    return HttpResponse.json(store().favorites[user()!.id])
  }),
]
