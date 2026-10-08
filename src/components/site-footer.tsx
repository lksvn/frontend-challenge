import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { Catalog } from '../contracts'
import { api } from '../lib/api'
import { Button } from './ui/button'

export function SiteFooter() {
  const catalogQuery = useQuery({
    queryKey: ['nfts', 'featured'],
    queryFn: async ({ signal }) =>
      (await api.get<Catalog>('/nfts', { params: { featured: true }, signal })).data,
  })

  return (
    <footer className="site-footer">
      <div className="footer-features">
        <article>
          <span className="feature-symbol">W</span>
          <h2>Segurança da carteira</h2>
          <p>Proteja sua carteira e colecione arte digital verificada com confiança.</p>
        </article>
        <article>
          <span className="feature-symbol">C</span>
          <h2>Criadores em destaque</h2>
          <p>Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.</p>
        </article>
        <article>
          <span className="feature-symbol">D</span>
          <h2>Alertas de lançamentos</h2>
          <p>
            Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.
          </p>
        </article>
        <article>
          <h2>Antecipe-se ao próximo lançamento</h2>
          <div className="newsletter-input">
            <label>
              <span className="sr-only">E-mail para novidades</span>
              <input
                type="email"
                placeholder="digite seu e-mail..."
                disabled
                title="Newsletter indisponível nesta demonstração"
              />
            </label>
            <Button disabled title="Newsletter indisponível nesta demonstração">
              Enviar
            </Button>
          </div>
          <p>Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p>
        </article>
      </div>
      <div className="footer-contact">
        <strong>KURIO</strong>
        <span>
          Feito para colecionadores,
          <br />
          criadores e cultura
        </span>
        <span>contato@email.com</span>
        <span>+55 11 4002 8922</span>
      </div>
      <div className="footer-links">
        <div>
          <h2>Meu perfil</h2>
          <Link to="/profile">Meu perfil</Link>
          <Link to="/favorites">Lista de interesse</Link>
          {['Minha coleção', 'Atividade', 'Estúdio do criador'].map((label) => (
            <a key={label} role="link" aria-disabled="true" title="Página ainda indisponível">
              {label}
            </a>
          ))}
        </div>
        <div>
          <h2>Central de ajuda</h2>
          {[
            'Central de ajuda',
            'Como comprar NFTs',
            'Carteira e segurança',
            'Política do mercado',
            'Denunciar item',
          ].map((label) => (
            <a key={label} role="link" aria-disabled="true" title="Página ainda indisponível">
              {label}
            </a>
          ))}
        </div>
        <div>
          <h2>Coleções</h2>
          {catalogQuery.data?.filters.categories.map(({ name }) => (
            <Link
              key={name}
              to="/"
              hash="catalogo"
              search={{ q: '', category: name, network: '', sort: 'recent', page: 1 }}
            >
              {name}
            </Link>
          ))}
        </div>
        <div>
          <h2>Redes sociais</h2>
          <div className="footer-socials">
            {['Facebook', 'Instagram', 'Twitter', 'Linkedin', 'YouTube'].map((network) => (
              <a
                key={network}
                role="link"
                aria-disabled="true"
                aria-label={network}
                title="Link ainda indisponível"
              >
                <span
                  className="asset-icon"
                  style={{
                    maskImage: `url(${import.meta.env.BASE_URL}assets/${network.toLowerCase()}.svg)`,
                  }}
                  aria-hidden="true"
                />
              </a>
            ))}
          </div>
          <h2>Carteiras compatíveis</h2>
          <p className="wallet-badge">METAMASK · WALLETCONNECT · COINBASE</p>
        </div>
      </div>
      <p className="copyright">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}
