# Arquitetura e limites da simulação

## Organização

`src/router.tsx` define as rotas e os parâmetros do catálogo. As telas ficam em `src/pages`, os blocos compartilhados em `src/components` e os hooks em `src/hooks`. Carrinho, checkout, perfil, carteiras e favoritos carregam seus componentes sob demanda.

TanStack Query cuida de consultas, mutations e cache. Axios faz as chamadas HTTP. MSW intercepta REST e WebSocket; a interface usa as mesmas chamadas em desenvolvimento, testes e demonstração. Os contratos de transporte estão em `src/contracts.ts`.

Os componentes em `src/components/ui` seguem o padrão shadcn/ui, com Radix para comportamento e Tailwind/CVA para apresentação. O tema e os estilos por área ficam em `src/styles`. Usamos CSS com aninhamento nativo e `@apply`, sem Sass. A busca de classes do Tailwind fica limitada a `src`.

## Contratos REST

Todos os caminhos abaixo usam o prefixo `/api`. Valores em ETH trafegam como strings decimais; quantidades e versões são inteiras. Os cálculos usam `bigint` em wei, com conversão apenas nas fronteiras de transporte e apresentação.

| Método e recurso             | Entrada e resposta                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| GET /session                 | `User` ou `null`                                                                         |
| POST /login                  | `email`, `password` → `User`; mescla carrinho visitante                                  |
| POST /register               | `name`, `username`, `email`, `password`, `confirm` → conta criada                        |
| POST /logout                 | Encerra a sessão                                                                         |
| GET /nfts                    | `view`, `q`, `category`, `network`, `sort`, `page`, `min`, `max`, `featured` → `Catalog` |
| GET /nfts/:id                | `Nft`, incluindo galeria, edições e disponibilidade                                      |
| GET /favorites               | Lista de IDs do usuário                                                                  |
| PUT /favorites/:id           | Alterna favorito e devolve a lista atual                                                 |
| GET /cart                    | `CartItem[]` do visitante ou usuário                                                     |
| PUT /cart/:id                | `quantity`, `edition`; quantidade zero remove o item                                     |
| POST /quote                  | `coupon` → `Quote` com itens, subtotal, desconto, taxa, total e validade                 |
| POST /orders                 | `quoteId`, `walletId`, `collector`; header `Idempotency-Key` → `Order`                   |
| GET /orders/:id              | Estado e snapshot do pedido; acesso restrito ao proprietário                             |
| GET /profile                 | Dados do usuário                                                                         |
| PATCH /profile               | Dados pessoais e avatar → perfil atualizado                                              |
| POST /profile/password       | `current`, `password`, `confirm` → confirmação da alteração                              |
| GET /wallets                 | Carteiras do usuário                                                                     |
| PUT /wallets                 | Campos de `Wallet`; `id` identifica uma edição                                           |
| POST /wallets/:id/connection | `action`: connect, decline ou disconnect; `provider` opcional → `WalletConnection`       |
| GET /demo/state              | Cenário, opções e NFTs disponíveis                                                       |
| POST /demo/scenario          | `scenario`; muda a condição de teste preservando os dados                                |
| POST /demo/reset             | `scenario` opcional; recria o estado inicial                                             |

Erros usam `{ code, message, fields? }`. Validação retorna 422, sessão inválida 401, falta de permissão 403, recurso ausente 404, conflito 409 e falha transitória 503. Falha de conexão usa `HttpResponse.error()`.

## Sessão, persistência e cache

A sessão dura 30 minutos e é consultada a cada 30 segundos. Rotas privadas abrem o login e retomam o destino após autenticar. Falhas transitórias preservam os dados já recebidos; uma sessão inválida encerra o acesso. Logout e troca de usuário cancelam consultas e removem dados privados do cache. Queries privadas incluem a identidade do usuário.

Senhas são derivadas por PBKDF2/SHA-256, com 100.000 iterações e salt individual. Nada disso representa autenticação de produção: os mocks e sua persistência são controlados pelo próprio navegador.

O estado do mock fica em `localStorage`, na chave `kurio.mock.v1`, atualmente com schema 7 e migrações. Há dois usuários e 62 NFTs. Edições, estoque, raridade, rede, categoria e avaliação são sorteados ao criar/resetar as fixtures e depois persistidos. Os testes fixam o gerador quando precisam de dados estáveis. A Ana começa com uma carteira cadastrada.

Cupons ficam em `kurio.coupon`. A tentativa de compra fica em `sessionStorage`, em `kurio.attempt`, para recuperar chave e payload após refresh. O carrinho visitante é mesclado no login. A ordem dos itens é preservada ao editar quantidades.

O cache geral tem `staleTime` de 30 segundos e um retry para consultas. Mutations não têm retry automático. Favoritos usam atualização otimista com rollback. Requisições recebem `AbortSignal`; respostas antigas não devem substituir consultas mais recentes.

Se um GET recebe HTML porque o worker perdeu a interceptação, o cliente reinicia o MSW e tenta essa leitura uma única vez. Esse mecanismo não reenvia mutations nem erros HTTP 503.

## Cotação e pedidos

A cotação da API é a referência: validade de 60 segundos, taxa simulada de 0.016 ETH para carrinho com itens e cupom KURIO10 de 10% sobre o subtotal. `price` é o preço cobrado; `originalPrice` serve só para mostrar o preço anterior.

Antes de criar um pedido, o mock revalida carteira, campos, cotação, cupom, preços, edições e estoque. Mudanças exigem nova revisão. A mesma chave de idempotência com o mesmo payload recupera o pedido; outro payload gera conflito.

Pedidos começam pendentes e reservam estoque. A simulação confirma ou recusa depois; uma recusa devolve a reserva e mantém o carrinho. Confirmar remove somente os itens e quantidades comprados. Estados terminais não regridem. O recibo usa o snapshot da compra, incluindo itens, taxas, total e identificação fictícia `sim-*`.

Após timeout ou refresh, a consulta do pedido retoma seu processamento. O cenário timeout cria o pedido, mas atrasa a resposta por 10 segundos; o Axios encerra a espera em 8 segundos. Recuperar usa a tentativa existente, sem criar outra compra.

## Socket.IO

O cliente usa WebSocket no host atual, com `/socket.io/`, protocolo Engine.IO 4 e namespace padrão. MSW intercepta a conexão; não há servidor remoto. `@mswjs/socket.io-binding` é carregado quando a conexão abre. O mock implementa o handshake e ping/pong; polling, rooms e infraestrutura de blockchain ficam fora da simulação.

- `nft.updated`: `{ eventId, nft }`. O cliente compara `nft.version` com eventos e cache REST, descarta versões antigas/duplicadas e invalida catálogo, detalhe, carrinho e cotação. Mudanças de preço/estoque exibem um aviso acessível por três segundos.
- `order.updated`: `{ eventId, userId, order }`. Só atualiza a sessão correspondente e versões mais recentes; pedidos confirmados ou recusados não voltam a pendentes.

Reconectar reconsulta os recursos ativos. Listeners são removidos ao desmontar ou trocar de usuário. Nos testes, os controles alteram o servidor mock e seus listeners emitem pelo Socket.IO; não chamam setters ou cache da interface.

## UX, assets e limitações

O mobile usa views de detalhe, carrinho e pagamento com ações fixas. Perfil, carteiras e favoritos mantêm a navegação inferior. Os filtros abrem sobre a tela. Essas decisões seguem as referências disponíveis e os ajustes de usabilidade feitos durante a implementação.

No mobile, os dados do coletor vêm da conta/carteira e ficam ocultos quando válidos. A validação continua ativa e abre os campos se faltar informação. O cupom é editado no carrinho; no desktop também aparece no pagamento. O método da conexão simulada pode ser escolhido independentemente do tipo cadastrado na carteira.

Favoritos têm uma tela própria acessível pelo perfil e menu mobile. A ampliação da galeria fica apenas no desktop. Compartilhar usa o navegador quando disponível e cópia do link como alternativa. Ações editoriais, suporte, ofertas, downloads e o botão central sem fluxo definido ficam indisponíveis ou identificadas como fora do escopo.

Imagens WebP e SVGs exportados ficam em `public/assets`. A fonte Roboto Mono é local via Fontsource e sua licença acompanha os assets. A galeria usa a variedade dos assets disponíveis; não representa vistas reais de uma mesma obra. Os ícones de métodos de carteira sem asset usam suas iniciais.

Diálogos usam Radix para foco e teclado; ações sem texto têm nomes acessíveis. Skeletons têm shimmer e respeitam movimento reduzido. As referências visuais cobrem início, detalhe, carrinho e pagamento no desktop. As imagens atuais foram geradas no Windows; a rasterização pode exigir referências próprias em outro sistema.

Os dados são locais por navegador; não há sincronização entre abas. Perfil e senha são salvos por chamadas independentes: falhar ao salvar o perfil não desfaz uma senha já alterada.

## Publicação e verificações

O GitHub Pages usa `DEPLOY_BASE=/frontend-challenge/`. O Router, assets e worker respeitam esse prefixo. `404.html` volta ao index, que restaura caminho, query e hash. Links diretos funcionam após esse redirecionamento, mas a primeira resposta HTTP é 404; não há rewrite de servidor.

Os comandos de execução, cenários e reset estão no README. Playwright cobre fluxos, erros, teclado, skeletons e regressão visual. Lighthouse mede o build completo em três execuções por página/perfil; relatórios e condições ficam em `reports/lighthouse`.

A auditoria local atingiu as metas. Ainda há LCP mobile acima de 2,5s e deslocamento do rodapé durante o carregamento do detalhe desktop. O preview local não garante a mesma nota na hospedagem pública.
