"use client";

import { useState, useEffect, useRef, type ImgHTMLAttributes } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Campos de TEXTO comuns a todos os slides — camada HTML por cima da foto.
// A estrutura já está pronta pra vir de fora (banco/admin) via prop `slides`.
type SlideText = {
  title: string;
  subtitle?: string;
  badges?: string[]; // selos/chips exibidos em linha
  ctaText?: string;
  ctaHref?: string;
  textAlign?: "left" | "right"; // lado do bloco de texto no DESKTOP
};

type Slide =
  | (SlideText & {
      type: "image";
      src: string; // foto DESKTOP 2400x1000 (proporção 2,4:1) — SÓ A FOTO, sem texto
      srcMobile?: string; // foto MOBILE 1080x1350 (proporção 4:5) — art-direction
      alt: string;
    })
  | (SlideText & { type: "video"; src: string; poster?: string });

const defaultSlides: Slide[] = [
  {
    type: "image",
    src: "https://ext.same-assets.com/2738959979/2302845870.webp",
    // TODO: trocar pela versão mobile 1080x1350 (hoje é placeholder = mesma URL do desktop)
    srcMobile: "https://ext.same-assets.com/2738959979/2302845870.webp",
    alt: "Coleção Feminnita",
    title: "Nova Coleção",
    subtitle: "Peças que acompanham cada movimento do seu dia.",
    badges: ["Lançamento", "Frete grátis"],
    ctaText: "VER COLEÇÃO",
    ctaHref: "/produtos",
    textAlign: "left",
  },
  {
    type: "image",
    src: "https://ext.same-assets.com/2738959979/1774049605.webp",
    // TODO: trocar pela versão mobile 1080x1350 (hoje é placeholder = mesma URL do desktop)
    srcMobile: "https://ext.same-assets.com/2738959979/1774049605.webp",
    alt: "Flowing Collection",
    title: "Flowing Collection",
    subtitle: "Tecido leve, caimento perfeito, conforto o dia inteiro.",
    badges: ["Novidade"],
    ctaText: "COMPRAR AGORA",
    ctaHref: "/lancamentos",
    textAlign: "right",
  },
  {
    type: "video",
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
    poster: "https://ext.same-assets.com/2738959979/2302845870.webp",
    title: "Nossa Essência",
    subtitle: "Design, movimento e atitude em cada peça.",
    badges: ["Marca"],
    ctaText: "CONHECER MARCA",
    ctaHref: "/sobre",
    textAlign: "left",
  },
  {
    type: "image",
    src: "https://ext.same-assets.com/2738959979/1774049605.webp",
    // TODO: trocar pela versão mobile 1080x1350 (hoje é placeholder = mesma URL do desktop)
    srcMobile: "https://ext.same-assets.com/2738959979/1774049605.webp",
    alt: "Mais Vendidos",
    title: "Os Mais Vendidos",
    subtitle: "As favoritas de quem já é Feminnita.",
    badges: ["Top vendas", "Últimas peças"],
    ctaText: "MAIS VENDIDOS",
    ctaHref: "/mais-vendidos",
    textAlign: "right",
  },
  {
    type: "image",
    src: "https://ext.same-assets.com/2738959979/2302845870.webp",
    // TODO: trocar pela versão mobile 1080x1350 (hoje é placeholder = mesma URL do desktop)
    srcMobile: "https://ext.same-assets.com/2738959979/2302845870.webp",
    alt: "Outlet Feminnita",
    title: "Outlet",
    subtitle: "Peças selecionadas com preços que não voltam.",
    badges: ["Até 50% OFF"],
    ctaText: "APROVEITAR OUTLET",
    ctaHref: "/outlet",
    textAlign: "left",
  },
];

// ---------------------------------------------------------------------------
// Cloudinary helper (Requisito 7)
// Para URLs res.cloudinary.com/.../upload/... injeta f_auto,q_auto + largura
// responsiva. Para URLs que NÃO são Cloudinary (placeholders same-assets),
// retorna a URL original SEM quebrar.
// ---------------------------------------------------------------------------
const CLD_WIDTHS = [768, 1080, 1366, 1600, 1920, 2400];

function isCloudinary(url: string): boolean {
  return /res\.cloudinary\.com\/.+\/upload\//.test(url);
}

/** Injeta as transformações Cloudinary logo após /upload/. Não-Cloudinary → original. */
function cldUrl(url: string, width?: number): string {
  if (!isCloudinary(url)) return url;
  const t = width ? `f_auto,q_auto,w_${width}` : "f_auto,q_auto";
  return url.replace("/upload/", `/upload/${t}/`);
}

/** srcset por largura para Cloudinary; para não-Cloudinary devolve a URL única. */
function buildSrcSet(url: string): string {
  if (!isCloudinary(url)) return url;
  return CLD_WIDTHS.map((w) => `${cldUrl(url, w)} ${w}w`).join(", ");
}

export function HeroCarousel({ slides = defaultSlides }: { slides?: Slide[] }) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent(index);
      setIsTransitioning(false);
    }, 300);
  };

  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = () => goTo((current + 1) % slides.length);

  useEffect(() => {
    const slide = slides[current];
    if (slide.type === "video" && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }

    timerRef.current = setTimeout(() => {
      next();
    }, slide.type === "video" ? 12000 : 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, slides]);

  const slide = slides[current];

  // Requisito 4: object-position padrão = center.
  // >>> TROCAR AQUI o object-position caso algum banner precise de outro ponto
  //     (ex.: "top", "center 30%", "left center"). Se precisar por-slide, mova
  //     para o tipo Slide como campo objectPosition e leia daqui.
  const OBJECT_POSITION = "center";

  // Prioridade de carregamento: 1º slide = eager + fetchPriority high; demais = lazy.
  const imgPriority: ImgHTMLAttributes<HTMLImageElement> =
    current === 0
      ? { loading: "eager", fetchPriority: "high" }
      : { loading: "lazy" };

  const align = slide.textAlign ?? "left";

  // Camada de texto:
  //  - MOBILE: bloco em fluxo normal, DESCE para baixo da foto (empilhado).
  //  - DESKTOP: absoluto sobre a foto, de um lado (esquerda/direita) conforme
  //    textAlign, verticalmente centralizado, com scrim (gradiente) SÓ atrás do
  //    texto — não sobre a foto inteira.
  const textLayerClass = [
    "relative z-10 flex flex-col justify-center gap-4 px-6 py-8",
    "items-start text-left", // alinhamento mobile
    "md:absolute md:inset-y-0 md:w-1/2 md:max-w-2xl md:py-12 md:px-12 lg:px-20",
    align === "right"
      ? "md:right-0 md:items-end md:text-right md:bg-gradient-to-l md:from-black/70 md:via-black/40 md:to-transparent"
      : "md:left-0 md:items-start md:text-left md:bg-gradient-to-r md:from-black/70 md:via-black/40 md:to-transparent",
    "transition-opacity duration-500",
    isTransitioning ? "opacity-0" : "opacity-100",
  ].join(" ");

  return (
    // Requisito 2: full-bleed 100vw — renderizado FORA de qualquer container na
    //   page.tsx (direto dentro de <div className="min-h-screen">), então w-full
    //   já equivale a 100vw, sem margin negativa e sem scroll horizontal.
    <section className="relative w-full bg-black">
      {/* FOTO — Requisito 1: aspect 4/5 mobile, 12/5 (2,4:1) desktop.
          Requisito 3: max-h-[78vh] trava a altura em telas largas (corta via cover). */}
      <div className="relative w-full aspect-[4/5] md:aspect-[12/5] max-h-[78vh] overflow-hidden">
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          {slide.type === "image" ? (
            // Requisito 5: art-direction via <picture> nativo. Mobile (<=768px)
            // 1080x1350; desktop (>=769px) 2400x1000. Requisito 7: f_auto,q_auto + srcset.
            <picture>
              <source
                media="(max-width: 768px)"
                srcSet={buildSrcSet(slide.srcMobile ?? slide.src)}
                sizes="100vw"
              />
              <source
                media="(min-width: 769px)"
                srcSet={buildSrcSet(slide.src)}
                sizes="100vw"
              />
              {/* Requisito 4: object-cover + object-position center */}
              <img
                src={cldUrl(slide.src)}
                alt={slide.alt}
                className="w-full h-full object-cover"
                style={{ objectPosition: OBJECT_POSITION }}
                {...imgPriority}
              />
            </picture>
          ) : (
            <video
              ref={videoRef}
              src={slide.src}
              poster={slide.poster}
              className="w-full h-full object-cover"
              style={{ objectPosition: OBJECT_POSITION }}
              muted
              playsInline
              loop={false}
            />
          )}
        </div>

        {/* Setas (dentro da caixa da foto) */}
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/50 text-white p-2 rounded-full transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/50 text-white p-2 rounded-full transition-colors"
          aria-label="Próximo"
        >
          <ChevronRight size={24} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-8 bg-white" : "w-2 bg-white/50"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* CAMADA DE TEXTO (HTML por cima / abaixo da foto) — NUNCA queimada na imagem */}
      <div className={textLayerClass}>
        {slide.badges && slide.badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {slide.badges.map((b, i) => (
              <span
                key={i}
                className="px-3 py-1 text-xs font-semibold uppercase tracking-wide bg-white/90 text-black rounded-full"
              >
                {b}
              </span>
            ))}
          </div>
        )}

        <h2 className="text-3xl md:text-5xl font-light text-white leading-tight">
          {slide.title}
        </h2>

        {slide.subtitle && (
          <p className="text-sm md:text-lg text-white/80 max-w-md">{slide.subtitle}</p>
        )}

        {slide.ctaText && slide.ctaHref && (
          <a
            href={slide.ctaHref}
            className="inline-block w-fit px-8 py-3 bg-white text-black text-sm font-semibold tracking-widest hover:bg-black hover:text-white transition-colors duration-300"
          >
            {slide.ctaText}
          </a>
        )}
      </div>
    </section>
  );
}
