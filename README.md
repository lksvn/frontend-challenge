# Kurio — Marketplace NFT

## Requisitos

Node.js 24 e pnpm 11.19.0.

```sh
npm install --global pnpm@11.19.0
pnpm install --frozen-lockfile
```

## Executar localmente

```sh
pnpm dev
```

Abra http://127.0.0.1:5173. Se a porta estiver ocupada, utilize o endereço informado no terminal.

Os mocks REST e Socket.IO são iniciados automaticamente. Não é necessário configurar backend, banco de dados ou carteira real. As compras são simuladas. Mantenha `VITE_ENABLE_MOCKS=true`, como em `.env.example`.

## Contas de demonstração

| E-mail         | Senha     |
| -------------- | --------- |
| ana@kurio.test | Kurio123! |
| leo@kurio.test | Kurio123! |

Também é possível criar uma conta pela interface. Os dados simulados persistem no navegador. Para começar novamente, limpe os dados do site ou utilize uma janela anônima.

Cupom válido: `KURIO10`. `EXPIRED` representa um cupom expirado.

Para testar uma compra: adicione um NFT disponível ao carrinho, entre em uma conta, cadastre uma carteira na tela Carteiras e prossiga ao pagamento. Um endereço fictício válido é `0x1111111111111111111111111111111111111111`. Selecione a carteira, simule a conexão, preencha os campos obrigatórios e confirme.

## Build de produção

```sh
pnpm build
pnpm preview
```

O terminal informa o endereço do preview.

## Verificações

```sh
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm exec playwright install chromium
pnpm test:e2e
```

Os testes E2E iniciam seu próprio servidor. O relatório fica em `playwright-report/index.html`.

## GitHub Pages

Aplicação: https://lksvn.com.br/frontend-challenge/

O workflow do GitHub Actions instala as dependências, executa os testes unitários, compila com os mocks habilitados e publica `dist` quando recebe um push na branch `main`.

Para gerar o mesmo build localmente em PowerShell:

```powershell
$env:DEPLOY_BASE='/frontend-challenge/'
pnpm build
pnpm preview
Remove-Item Env:DEPLOY_BASE
```

No preview, abra `/frontend-challenge/`. O Pages utiliza `404.html` para redirecionar acessos diretos e refresh das rotas ao index, preservando a URL. A requisição inicial dessas rotas recebe HTTP 404 antes do redirecionamento.
