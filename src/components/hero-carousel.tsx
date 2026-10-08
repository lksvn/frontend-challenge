import { useState } from 'react'
import { Button } from './ui/button'

const slides = [
  {
    src: `${import.meta.env.BASE_URL}assets/nft-2.webp`,
    alt: 'Arte digital de um macaco com óculos e jaqueta verde',
  },
  {
    src: `${import.meta.env.BASE_URL}assets/nft-1.webp`,
    alt: 'Arte digital de um macaco com chapéu e blusa roxa',
  },
  {
    src: `${import.meta.env.BASE_URL}assets/nft-3.webp`,
    alt: 'Arte digital de um macaco com paletó claro',
  },
]

export function HeroCarousel() {
  const [activeSlide, setActiveSlide] = useState(0)
  return (
    <section className="hero" aria-label="Destaques" aria-roledescription="carrossel">
      <div>
        <p className="hero-welcome">Bem-vindo à kurio</p>
        <h1>
          <span className="desktop-headline">SEJA DONO DO FUTURO DA ARTE DIGITAL</span>
          <span className="mobile-headline">SEJA DONO DA CULTURA DIGITAL</span>
        </h1>
        <p className="hero-description">
          <span className="desktop-headline">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
            rara, apoie artistas e tenha uma parte da cultura da internet.
          </span>
          <span className="mobile-headline">
            Descubra NFTs selecionados de criadores do mundo todo.
          </span>
        </p>
        <Button asChild>
          <a href="#catalogo">
            EXPLORAR
            <span className="mobile-headline" aria-hidden="true">
              {' '}
              →
            </span>
          </a>
        </Button>
      </div>
      <div className="hero-art">
        <img
          src={slides[activeSlide].src}
          alt={slides[activeSlide].alt}
          width="450"
          height="450"
          fetchPriority="high"
        />
        <img
          className="hero-secondary-art"
          src={slides[(activeSlide + 1) % slides.length].src}
          alt=""
          width="60"
          height="60"
        />
      </div>
      <nav className="hero-pagination" aria-label="Slides do destaque">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Exibir slide ${index + 1}`}
            aria-current={activeSlide === index ? 'true' : undefined}
            onClick={() => setActiveSlide(index)}
          >
            <span aria-hidden="true" />
          </button>
        ))}
      </nav>
    </section>
  )
}
