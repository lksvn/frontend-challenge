import { fromWei, toWei } from '../lib/money.ts'
import type { Nft } from '../contracts'

const assetBase = import.meta.env?.BASE_URL ?? '/'

const names = ['Emerald Ape', 'Sage Nomad', 'Neon Vessel', 'Golden Beat']
const networks = ['Ethereum', 'Polygon', 'Solana']
const rarities = ['RARO', null]
const categories = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Colecionáveis',
  'Generativa',
  'Jogos',
  'Assinaturas',
  'Utilidade',
]
const featured = [
  { name: 'Emerald Ape #042', price: '1.19', imageId: 2 },
  { name: 'Sage Nomad #009', price: '1.69', imageId: 1 },
  { name: 'Neon Vessel #552', price: '1.99', imageId: 4 },
  { name: 'Cosmic Bloom #118', price: '1.29', imageId: 1 },
  { name: 'Violet Nomad #314', price: '1.39', imageId: 1 },
  { name: 'Ivory Baron #088', price: '1.79', imageId: 4 },
  { name: 'Golden Beat #207', price: '0.99', imageId: 3 },
  { name: 'Golden Frequency #071', price: '0.59', imageId: 3 },
  { name: 'Golden Signal #160', price: '0.39', imageId: 3 },
] as const

const editionOptions = [
  { id: 'special', name: '1/1', capacity: 1 },
  { id: 'limited', name: '1/10', capacity: 10 },
  { id: 'standard', name: '1/50', capacity: 50 },
  { id: 'open', name: 'ABERTA', capacity: 100 },
]

export function promotionalPrice(originalPrice: string) {
  return fromWei((toWei(originalPrice) * 80n) / 100n)
}

export function createNfts(random = Math.random): Nft[] {
  return Array.from({ length: 62 }, (_, index) => {
    const selectedEdition = Math.floor(random() * editionOptions.length)
    const capacity = editionOptions[selectedEdition].capacity
    const available = Math.floor(random() * (capacity + 1))
    const featuredNft = featured[index]
    const imageId = featuredNft?.imageId ?? [2, 1, 4, 3][index % 4]
    const image = `${assetBase}assets/nft-${imageId}.webp`
    const originalPrice =
      featuredNft?.price ?? `${1 + (index % 3)}.${String(19 + index).padStart(2, '0')}`
    const onSale = index % 3 === 0
    const name = featuredNft?.name ?? `${names[index % 4]} #${String(index + 1).padStart(3, '0')}`
    const network = networks[Math.floor(random() * networks.length)]
    return {
      id: String(index + 1),
      name,
      image,
      images: Array.from({ length: 1 + Math.floor(random() * 4) }, (_, imageIndex) =>
        imageIndex === 0
          ? image
          : `${assetBase}assets/nft-${((imageId - 1 + imageIndex) % 4) + 1}.webp`,
      ),
      description: `Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na ${network} com arte desbloqueável e acesso para colecionadores.`,
      tokenId: name.split('#')[1].padStart(4, '0'),
      attributes: ['Óculos', ['Esmeralda', 'Sálvia', 'Marfim', 'Dourado'][imageId - 1]],
      details: {
        paragraphs: [
          `${name} é uma obra digital ${editionOptions[selectedEdition].name} finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na ${network}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
          'A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.',
        ],
        network: `Cunhado na ${network} com procedência imutável e metadados armazenados no IPFS.`,
        royalties:
          'Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.',
        contract: '0x7A42...19E8 · Contrato inteligente ERC-721 verificado.',
      },
      collection: 'Kurio Editions',
      category: categories[Math.floor(random() * categories.length)],
      network,
      price: onSale ? promotionalPrice(originalPrice) : originalPrice,
      ...(onSale ? { originalPrice } : {}),
      available,
      version: 1,
      featured: index === 1,
      rarity: rarities[Math.floor(random() * rarities.length)],
      rating: {
        score: Math.round((1 + random() * 4) * 10) / 10,
        count: index === 0 ? 19 : 8 + index,
      },
      editions: editionOptions.map((edition, editionIndex) => ({
        id: edition.id,
        name: edition.name,
        enabled: editionIndex === selectedEdition,
      })),
    }
  })
}

// Seleções determinísticas da demonstração, sem métricas reais de mercado.
export const catalogSelections = {
  new: ['28', '29', '30', '31', '32', '33', '34', '35', '36'],
  trending: ['1', '3', '5', '7', '9', '11'],
}
