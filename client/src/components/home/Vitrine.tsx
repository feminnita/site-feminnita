"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { VideoSection } from "../../types/banners/banners";

// Os MP4 já são entregues pré-comprimidos à mão (desktop CRF26, mobile).
// NÃO pedir f_auto/q_auto: transformar vídeo gasta hd_video_second a cada view
// (o plano Free guarda só 10 derived, então re-transforma sempre). Servir o
// arquivo cru zera esse consumo, independente de tráfego.
function otimizado(url: string) {
    return url;
}

/**
 * A capa do vídeo.
 *
 * Antes era gerada pela Cloudinary (transformação `so_0` extraía o frame 0) e
 * a função montava a URL trocando `/upload/` no caminho. Quando as mídias
 * foram para o R2 em 22/09/2026, esse caminho deixou de existir e a função
 * passou a devolver `undefined` — em silêncio. O elemento ficou SEM poster, e
 * como vídeo sem quadro carregado não pinta nada, a cliente via o fundo creme
 * da seção (#E9E4DF) ocupando a tela inteira. Foi assim que a home apareceu
 * em 29/09/2026.
 *
 * As capas certas existiam desde 26/08/2026, na mesma pasta em que o vídeo foi
 * entregue — 1920x1080 e 1080x1350, exatamente as medidas de cada vídeo. Nunca
 * foram usadas: o código preferiu depender da Cloudinary gerar uma sozinha.
 *
 * São duas porque o enquadramento difere — o desktop é 16:9 e o mobile 4:5 — e
 * o atributo `poster` não aceita media query, então a escolha é feita no
 * cliente, depois de montar.
 */
const CAPA_DESKTOP =
    "https://pub-3c261fc069aa46e795f1276f1f25ed51.r2.dev/vitrine/capa-desktop.webp";
const CAPA_MOBILE =
    "https://pub-3c261fc069aa46e795f1276f1f25ed51.r2.dev/vitrine/capa-mobile.webp";

type VitrineProps = {
    videoSection: VideoSection;
};

export function Vitrine({ videoSection }: VitrineProps) {
    const ref = useRef<HTMLVideoElement>(null);
    const [capa, setCapa] = useState(CAPA_DESKTOP);

    useEffect(() => {
        setCapa(
            window.matchMedia("(max-width: 767px)").matches
                ? CAPA_MOBILE
                : CAPA_DESKTOP,
        );
    }, []);

    useEffect(() => {
        const v = ref.current;
        if (!v) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        let carregou = false;

        const tocar = () => {
            // Com preload="none" o elemento sobe sem fonte escolhida. Pedir
            // play() nesse estado não tem o que tocar, e o navegador recusa.
            // O load() explícito é o que faz a <source> ser resolvida antes.
            if (!carregou) {
                v.load();
                carregou = true;
            }

            // Só toca quando o navegador diz que tem o que tocar à frente
            // (HAVE_FUTURE_DATA). Dar play com o buffer vazio faz o vídeo
            // engasgar nos primeiros segundos — e agora que existe capa,
            // esperar não custa nada: a cliente vê a imagem enquanto carrega,
            // em vez de um vídeo tropeçando.
            if (v.readyState < 3) {
                v.addEventListener("canplay", tocar, { once: true });
                return;
            }

            v.play().catch((erro: unknown) => {
                // NÃO engolir. A versão anterior fazia `.catch(() => {})`, e
                // por isso o vídeo parou de tocar sem deixar rastro em lugar
                // nenhum — nem no console da cliente, nem para quem fosse
                // investigar depois.
                const e = erro as { name?: string; message?: string };
                console.warn("[vitrine] não consegui tocar:", e?.name, e?.message);

                // Navegador que bloqueia reprodução automática só libera
                // depois de um gesto. Tentar de novo no primeiro toque ou
                // rolagem custa nada e recupera esse caso.
                document.addEventListener("pointerdown", tocar, { once: true });
                document.addEventListener("scroll", tocar, { once: true, passive: true });
            });
        };

        if (!("IntersectionObserver" in window)) {
            tocar();
            return;
        }

        const obs = new IntersectionObserver(
            ([e]) => (e.isIntersecting ? tocar() : v.pause()),
            { threshold: 0.25 },
        );
        obs.observe(v);

        const aoTrocarAba = () => document.hidden && v.pause();
        document.addEventListener("visibilitychange", aoTrocarAba);

        return () => {
            obs.disconnect();
            document.removeEventListener("visibilitychange", aoTrocarAba);
            document.removeEventListener("pointerdown", tocar);
            document.removeEventListener("scroll", tocar);
            v.removeEventListener("canplay", tocar);
        };
    }, []);

    const { desktopUrl, mobileUrl, href } = videoSection;

    const player = (
        <video
            ref={ref}
            muted
            loop
            playsInline
            preload="none"
            disablePictureInPicture
            poster={capa}
            className="block aspect-[4/5] w-full object-cover md:aspect-video"
        >
            {mobileUrl && (
                <source
                    src={otimizado(mobileUrl)}
                    media="(max-width: 767px)"
                    type="video/mp4"
                />
            )}
            <source src={otimizado(desktopUrl)} type="video/mp4" />
        </video>
    );

    return (
        <section
            aria-label="Vitrine Feminnita"
            className="relative w-full overflow-hidden bg-[#E9E4DF]"
        >
            {href ? (
                <Link href={href} className="block cursor-pointer">
                    {player}
                </Link>
            ) : (
                player
            )}
        </section>
    );
}
