import type { DemoState } from '../contracts'
import { store } from './store'

const scenarios: DemoState['scenarios'] = [
  {
    id: 'success',
    label: 'Sucesso',
    description:
      'Respostas normais. Trocar o cenário mantém carrinho, estoque e pedidos; use Resetar demonstração para restaurar os dados.',
  },
  {
    id: 'slow',
    label: 'Rede lenta',
    description:
      'As próximas requisições REST terão atraso. Abra outra tela ou recarregue para observar o carregamento.',
  },
  {
    id: 'variable',
    label: 'Latência variável',
    description:
      'Altere rapidamente filtros ou ordenação: consultas antigas devem ser canceladas ou descartadas.',
  },
  {
    id: 'offline',
    label: 'Sem conexão REST',
    description:
      'As próximas requisições REST falham. O Socket.IO permanece disponível. Selecione Sucesso para recuperar.',
  },
  {
    id: 'server-error',
    label: 'HTTP 503',
    description: 'A API retorna erro temporário. Selecione Sucesso para tentar novamente.',
  },
  {
    id: 'expired',
    label: 'Sessão expirada',
    description:
      'A sessão atual foi encerrada. Em telas privadas, o login abre em modal; no catálogo, o botão Entrar fica disponível.',
  },
  {
    id: 'favorite-error',
    label: 'Falha de favorito',
    description:
      'Entre, abra um NFT e clique em Favoritar. A API recusará a alteração e o favorito deve voltar ao estado anterior.',
  },
  {
    id: 'declined',
    label: 'Pagamento recusado',
    description:
      'O próximo pedido será recusado. Selecione antes de Confirmar compra; pedidos já criados mantêm seu resultado.',
  },
  {
    id: 'timeout',
    label: 'Timeout após compra',
    description:
      'O próximo pedido será criado, mas a resposta atrasará 10s. Após o erro de conexão em 8s, recarregue o pagamento e use Recuperar pedido.',
  },
]

export function demoState(): DemoState {
  return {
    scenario: store().scenario,
    scenarios,
    nfts: store().nfts.map(({ id, name }) => ({ id, name })),
  }
}
