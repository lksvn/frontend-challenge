import { Link } from '@tanstack/react-router'
import { Button } from './ui/button'

export function HomeExtras() {
  return (
    <>
      <section className="promos" id="criadores" aria-label="Coleções em destaque">
        <article className="promo-card">
          <img
            src={`${import.meta.env.BASE_URL}assets/nft-2.webp`}
            alt="Emerald Ape"
            width="320"
            height="320"
            loading="lazy"
          />
          <div>
            <h2>Lançamentos gênesis de edição limitada</h2>
            <p>Colecione edições escassas diretamente dos criadores antes da revelação pública.</p>
            <Button asChild>
              <Link
                to="/"
                hash="catalogo"
                search={{ q: '', category: 'Arte digital', network: '', sort: 'recent', page: 1 }}
              >
                Explorar
                <span className="asset-icon arrow-right-icon" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </article>
        <article className="promo-card">
          <img
            src={`${import.meta.env.BASE_URL}assets/nft-4.webp`}
            alt="Neon Vessel"
            width="320"
            height="320"
            loading="lazy"
          />
          <div>
            <h2>Arte digital selecionada e muito mais</h2>
            <p>
              Explore novos artistas, coleções verificadas e obras digitais que definem a cultura
              on-chain.
            </p>
            <Button asChild>
              <Link
                to="/"
                hash="catalogo"
                search={{ q: '', category: 'Arte 3D', network: '', sort: 'recent', page: 1 }}
              >
                Explorar
                <span className="asset-icon arrow-right-icon" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </article>
      </section>
      <section className="journal" id="aprenda">
        <h2>Diário da Cunhagem</h2>
        <p className="text-copy text-[14px]">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
        <div className="journal-grid">
          {[
            [
              '4',
              '12 de setembro | Leitura de 6 min',
              'Como funciona a propriedade de NFTs',
              'Aprenda a colecionar, negociar e verificar ativos digitais.',
            ],
            [
              '2',
              '13 de setembro | Leitura de 2 min',
              '10 artistas digitais para acompanhar',
              'Conheça criadores que moldam a cultura digital.',
            ],
            [
              '1',
              '15 de setembro | Leitura de 3 min',
              'Raridade, atributos e procedência',
              'Entenda raridade, procedência, direitos autorais e utilidade.',
            ],
            [
              '3',
              '15 de setembro | Leitura de 2 min',
              'Como proteger sua carteira',
              'Proteja sua carteira, seus ativos e sua identidade.',
            ],
          ].map(([image, date, title, description]) => (
            <article key={title}>
              <img
                src={`${import.meta.env.BASE_URL}assets/nft-${image}.webp`}
                alt=""
                width="320"
                height="240"
                loading="lazy"
              />
              <div>
                <p className="text-copy text-[14px]">{date}</p>
                <h3>{title}</h3>
                <p className="text-copy text-[14px]">{description}</p>
                <a role="link" aria-disabled="true" title="Artigo ainda indisponível">
                  Ler mais →
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
