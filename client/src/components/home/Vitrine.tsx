"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { VideoSection } from "../../types/banners/banners";

function comTransform(url: string, t: string) {
    return url.includes("/upload/")
        ? url.replace("/upload/", `/upload/${t}/`)
        : url;
}

function otimizado(url: string) {
    return comTransform(url, "f_auto,q_auto");
}

function posterDe(url: string) {
    if (!url.includes("/upload/")) return undefined;
    return comTransform(url, "so_0,f_auto,q_auto").replace(/\.[^./?]+$/, ".jpg");
}

type VitrineProps = {
    videoSection: VideoSection;
};

export function Vitrine({ videoSection }: VitrineProps) {
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const v = ref.current;
        if (!v) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const tocar = () => v.play().catch(() => { });

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
            poster={posterDe(desktopUrl)}
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
