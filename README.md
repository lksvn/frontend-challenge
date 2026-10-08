# Kurio — Marketplace NFT

Enunciado do projeto: [CHALLENGE.md](CHALLENGE.md). Arquitetura e limitações: [ARCHITECTURE.md](ARCHITECTURE.md).

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

Para testar a compra, entre com a conta da Ana. Ela já tem uma carteira cadastrada. Adicione um NFT disponível ao carrinho e siga para o pagamento. Escolha a carteira, clique em Conectar e confirme. No desktop, confira os dados do comprador. No mobile, esses dados vêm do cadastro; o formulário só aparece se faltar alguma informação.

Para cadastrar outra carteira, use a tela Carteiras. Um endereço fictício válido é `0x2222222222222222222222222222222222222222`.

## Selecionar cenários e reproduzir falhas

Abra o site e, depois que ele carregar, abra o Console do navegador (F12 no desktop). Cole os exemplos abaixo para testar os cenários. As chamadas usam os mocks do próprio projeto.

Para mudar o cenário sem apagar seus dados:

```js
await fetch('/api/demo/scenario', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenario: 'server-error' }),
})
```

| Cenário          | Como reproduzir                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| `success`        | Funcionamento normal. Use para sair de um cenário de erro.                                            |
| `slow`           | Abra o catálogo ou altere um filtro para observar os skeletons.                                       |
| `variable`       | Alterne rapidamente a ordenação por preço no catálogo para testar respostas que chegam fora de ordem. |
| `offline`        | Abra o catálogo ou altere um filtro: a consulta falha por conexão.                                    |
| `server-error`   | Abra o catálogo ou altere um filtro: a consulta retorna HTTP 503.                                     |
| `expired`        | Entre antes de selecionar o cenário; acesse uma tela privada ou recarregue para retomar pelo login.   |
| `favorite-error` | Entre e tente favoritar um NFT: a ação falha e o coração volta ao estado anterior.                    |
| `declined`       | Selecione antes de confirmar uma compra: o pedido é recusado e os itens ficam no carrinho.            |
| `timeout`        | Confirme uma compra: a resposta demora demais; recarregue o pagamento e clique em “Recuperar pedido”. |

Para voltar ao normal, troque o cenário para `success` e clique em “Tentar novamente”. Pedidos já criados mantêm o resultado que tinham.

Para ver a lista de cenários:

```js
await fetch('/api/demo/state').then((response) => response.json())
```

Para começar do zero:

```js
await fetch('/api/demo/reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenario: 'success' }),
})
localStorage.removeItem('kurio.coupon')
sessionStorage.removeItem('kurio.attempt')
location.reload()
```

Isso apaga o que você criou na simulação, sai da conta e limpa o cupom e a tentativa de compra. As contas da Ana e do Leo voltam ao estado inicial.

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

Para reproduzir mudanças de preço/estoque e interrupções do Socket.IO:

```sh
pnpm test:e2e --grep "reconexão atualiza|evento durante revisão|pedido recupera"
```

Esses testes controlam o servidor mock e verificam os eventos recebidos pelo cliente Socket.IO.

Os testes E2E iniciam seu próprio servidor. O relatório fica em `playwright-report/index.html`. A última execução conferida também está em `reports/e2e/index.html`.

## Lighthouse

Com o Chromium instalado, gere o build e deixe o preview aberto:

```sh
pnpm build
pnpm preview --port 4188 --strictPort
```

Em outro terminal:

```sh
pnpm audit:lighthouse
```

São três medições de início e detalhe em desktop e mobile. Os relatórios HTML/JSON e as medianas ficam em `reports/lighthouse/`. O resumo inclui LCP, CLS, TBT e o ambiente da execução.

As metas são 90 em performance e SEO, e 95 em acessibilidade e boas práticas. A auditoria usa o build completo com os mocks no cenário padrão.

## GitHub Pages

Aplicação: https://lksvn.com.br/frontend-challenge/

O workflow do GitHub Actions instala as dependências, executa os testes unitários, compila com os mocks habilitados e publica `dist` quando recebe um push na branch `main`.

O Pages usa `404.html` para abrir links diretos e recarregar as rotas sem perder a URL. Nessas rotas, a primeira requisição recebe HTTP 404 antes do redirecionamento para a aplicação.
