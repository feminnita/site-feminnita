"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ProductGalleryProps } from "../../types/product/products";
import { videoKind } from "../../utils/product";
import { ChevronDown, ChevronUp, Film, Play } from "lucide-react";

// Vídeo do produto tocando inline como mais um item da galeria: autoplay, mudo,
// em loop, sem controles e sem player do YouTube. Toca SÓ quando está visível na
// tela (IntersectionObserver) e não pré-carrega nada até aparecer (preload=none).
function InlineVideo({
    src,
    poster,
    name,
}: {
    src: string;
    poster?: string;
    name: string;
}) {
    const ref = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.play().catch(() => {});
                } else {
                    el.pause();
                }
            },
            { threshold: 0.25 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <video
            ref={ref}
            src={src}
            poster={poster}
            muted
            loop
            playsInline
            autoPlay
            preload="none"
            aria-label={name}
            className="absolute inset-0 h-full w-full object-cover"
        />
    );
}

export function ProductGallery({
    productName,
    images,
    videoUrl,
    selectedImage,
    onSelectImage,
    showVideo,
    onShowVideo,
    embedUrl,
}: ProductGalleryProps) {
    const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
    const [zooming, setZooming] = useState(false);
    const [canHover, setCanHover] = useState(false);

    // Coluna de miniaturas: as setas só aparecem quando não cabem todas.
    const stripRef = useRef<HTMLDivElement | null>(null);
    const [canScroll, setCanScroll] = useState(false);

    useEffect(() => {
        const el = stripRef.current;
        if (!el) return;
        const check = () => setCanScroll(el.scrollHeight > el.clientHeight + 4);
        check();
        const ro = new ResizeObserver(check);
        ro.observe(el);
        return () => ro.disconnect();
    }, [images.length, videoUrl]);

    const scrollStrip = (dir: 1 | -1) => {
        const el = stripRef.current;
        if (!el) return;
        const first = el.firstElementChild as HTMLElement | null;
        const step = first ? first.offsetHeight + 12 : 140;
        el.scrollBy({ top: dir * step, behavior: "smooth" });
    };

    useEffect(() => {
        setCanHover(
            window.matchMedia("(hover: hover) and (pointer: fine)").matches,
        );
    }, []);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!canHover) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomOrigin(`${x}% ${y}%`);
    };

    const kind = videoKind(videoUrl);
    const isFileVideo = kind === "file";
    const isYouTube = kind === "youtube";

    // md:self-start — a galeria é uma célula da grade de 2 colunas e, por padrão,
    // ESTICA até a altura da coluna vizinha. Quando a descrição e as avaliações
    // passaram para a coluna da direita, ela ficou bem mais alta (1325px) e a foto
    // era esticada junto: 620x1325 exibindo um arquivo de 864x1156 — ampliada e
    // borrada. Com self-start a foto mantém a proporção 2:3 declarada.
    return (
        <div className="flex min-w-0 flex-col-reverse gap-3 md:flex-row md:self-start">
            {/* Miniaturas: COLUNA À ESQUERDA no desktop (referência: useange), com
                setas para percorrer quando não cabem todas — a barra de rolagem
                fica escondida. No celular viram uma linha abaixo da foto grande. */}
            {(images.length > 1 || videoUrl) && (
                <div className="flex flex-col items-center gap-1 md:w-24">
                    {canScroll && (
                        <button
                            type="button"
                            onClick={() => scrollStrip(-1)}
                            aria-label="Fotos anteriores"
                            className="hidden text-gray-400 transition-colors hover:text-gray-700 md:block"
                        >
                            <ChevronUp size={20} />
                        </button>
                    )}
                    <div
                        ref={stripRef}
                        className="flex w-full gap-2 overflow-x-auto sm:gap-3 md:max-h-[520px] md:flex-col md:overflow-y-auto md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden"
                    >
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => onSelectImage(index)}
                            className={`relative aspect-[2/3] min-w-[3.5rem] max-w-[7rem] flex-1 basis-0 md:w-full md:max-w-none md:flex-none overflow-hidden rounded-md border-2 bg-gray-100 ${!showVideo && selectedImage === index
                                    ? "border-[#8C2F39]"
                                    : "border-transparent hover:border-gray-300"
                                }`}
                        >
                            <Image
                                src={image}
                                alt={`${productName} ${index + 1}`}
                                fill
                                sizes="112px"
                                className="object-cover"
                            />
                        </button>
                    ))}
                    {videoUrl && (
                        <button
                            onClick={onShowVideo}
                            className={`relative flex aspect-[2/3] min-w-[3.5rem] max-w-[7rem] flex-1 basis-0 md:w-full md:max-w-none md:flex-none items-center justify-center overflow-hidden rounded-md border-2 bg-black ${showVideo
                                    ? "border-[#8C2F39]"
                                    : "border-transparent hover:border-gray-300"
                                }`}
                            title="Vídeo do produto"
                        >
                            {isFileVideo ? (
                                // Miniatura = primeiro quadro do próprio MP4 (sem tocar aqui),
                                // com selo discreto de vídeo. Sem botão de play.
                                <>
                                    <video
                                        src={videoUrl}
                                        muted
                                        playsInline
                                        preload="metadata"
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                    <Film
                                        size={14}
                                        className="absolute bottom-1 right-1 text-white drop-shadow"
                                    />
                                </>
                            ) : (
                                <>
                                    {images[0] && (
                                        <Image
                                            src={images[0]}
                                            alt="vídeo"
                                            fill
                                            sizes="112px"
                                            className="object-cover opacity-40"
                                        />
                                    )}
                                    <Play size={20} className="relative text-white" fill="white" />
                                </>
                            )}
                        </button>
                    )}
                    </div>
                    {canScroll && (
                        <button
                            type="button"
                            onClick={() => scrollStrip(1)}
                            aria-label="Próximas fotos"
                            className="hidden text-gray-400 transition-colors hover:text-gray-700 md:block"
                        >
                            <ChevronDown size={20} />
                        </button>
                    )}
                </div>
            )}

            <div
                className={`relative w-full max-w-sm self-center overflow-hidden rounded-lg bg-gray-100 md:max-w-none md:flex-1 md:self-auto ${showVideo && isYouTube
                        ? "aspect-video"
                        : "aspect-[4/5] md:aspect-[2/3]"
                    }`}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => canHover && !showVideo && setZooming(true)}
                onMouseLeave={() => setZooming(false)}
            >
                {showVideo && videoUrl && isFileVideo ? (
                    <InlineVideo
                        src={videoUrl}
                        poster={images[0]}
                        name={productName}
                    />
                ) : showVideo && videoUrl && isYouTube ? (
                    <iframe
                        src={embedUrl}
                        title={productName}
                        className="absolute inset-0 h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : images[selectedImage] ? (
                    <Image
                        src={images[selectedImage]}
                        alt={productName}
                        fill
                        sizes="(max-width: 768px) 384px, 45vw"
                        className={`cursor-zoom-in object-cover transition-transform duration-200 ease-out ${zooming ? "scale-[2]" : "scale-100"
                            }`}
                        style={{ transformOrigin: zoomOrigin }}
                        priority
                        quality={90}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                        Sem imagem
                    </div>
                )}
            </div>
        </div>
    );
}
