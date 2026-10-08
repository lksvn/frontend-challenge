import { useRef, useState } from 'react'
import { Button } from './ui/button'

const slides = [
  {
    src: `${import.meta.env.BASE_URL}assets/nft-2.webp`,
    alt: 'Arte digital de um macaco com óculos e jaqueta verde',
    welcome: 'Bem-vindo à kurio',
    title: 'SEJA DONO DO FUTURO DA ARTE DIGITAL',
    mobileTitle: 'SEJA DONO DA CULTURA DIGITAL',
    description:
      'Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.',
    mobileDescription: 'Descubra NFTs selecionados de criadores do mundo todo.',
  },
  {
    src: `${import.meta.env.BASE_URL}assets/nft-1.webp`,
    alt: 'Arte digital de um macaco com chapéu e blusa roxa',
    welcome: 'Encontre sua próxima coleção',
    title: 'DESCUBRA ARTE COM PERSONALIDADE',
    mobileTitle: 'DESCUBRA NOVAS COLEÇÕES',
    description:
      'Explore coleções, conheça novas histórias e encontre a arte que combina com você.',
    mobileDescription: 'Explore coleções e encontre a arte que combina com você.',
  },
  {
    src: `${import.meta.env.BASE_URL}assets/nft-3.webp`,
    alt: 'Arte digital de um macaco com paletó claro',
    welcome: 'Uma nova forma de colecionar',
    title: 'COMECE SUA COLEÇÃO DIGITAL',
    mobileTitle: 'CRIE SUA COLEÇÃO DIGITAL',
    description:
      'Escolha seus favoritos e dê o primeiro passo para construir sua coleção de arte digital.',
    mobileDescription: 'Escolha seus favoritos e comece sua coleção de arte digital.',
  },
]

export function HeroCarousel() {
  const [activeSlide, setActiveSlide] = useState(0)
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const slide = slides[activeSlide]
  return (
    <section
      className="hero"
      aria-label="Destaques"
      aria-roledescription="carrossel"
      onTouchStart={(event) => {
        const touch = event.touches[0]
        swipeStart.current =
          event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null
      }}
      onTouchCancel={() => {
        swipeStart.current = null
      }}
      onTouchEnd={(event) => {
        const start = swipeStart.current
        swipeStart.current = null
        if (!start) return
        const touch = event.changedTouches[0]
        const distanceX = touch.clientX - start.x
        const distanceY = touch.clientY - start.y
        if (Math.abs(distanceX) < 50 || Math.abs(distanceX) <= Math.abs(distanceY)) return
        setActiveSlide(
          (current) => (current + (distanceX < 0 ? 1 : -1) + slides.length) % slides.length,
        )
      }}
    >
      <div>
        <p className="hero-welcome">{slide.welcome}</p>
        <h1>
          <span className="desktop-headline">{slide.title}</span>
          <span className="mobile-headline">{slide.mobileTitle}</span>
        </h1>
        <p className="hero-description">
          <span className="desktop-headline">{slide.description}</span>
          <span className="mobile-headline">{slide.mobileDescription}</span>
        </p>
        <Button asChild>
          <a href="#catalogo">
            EXPLORAR
            <span className="mobile-headline" aria-hidden="true">
              <span className="asset-icon arrow-right-icon" />
            </span>
          </a>
        </Button>
      </div>
      <div className="hero-art">
        <img src={slide.src} alt={slide.alt} width="450" height="450" fetchPriority="high" />
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
