import Link from "next/link";
import type { CategoryBanner as CategoryBannerType } from "../../types/banners/banners";

export function CategoryBanner({ banner }: { banner: CategoryBannerType }) {
    // desktop >=768 baixa desktopSrc; abaixo disso, mobileSrc. <picture>/media
    // garante que só a imagem certa por largura é baixada (igual ao HeroCarousel).

    const textPosition = banner.textPosition || "bottom-left";
    const textTheme = banner.textTheme || "light";

    // Gradiente direcional baseado na posição do texto (mesma regra do hero):
    // escurece/clareia só o lado onde o texto fica, deixando o resto da imagem limpo.
    const baseColor = textTheme === "dark" ? "255,255,255" : "0,0,0";
    const dir = textPosition.includes("left")
        ? "to right"
        : textPosition.includes("right")
            ? "to left"
            : textPosition.includes("top")
                ? "to bottom"
                : "to top";
    const gradient = `linear-gradient(${dir}, rgba(${baseColor},.55), rgba(${baseColor},.15) 45%, transparent 70%)`;

    // Alinhamento do bloco de texto conforme a posição.
    const vertical = textPosition.includes("top")
        ? "justify-start"
        : textPosition.includes("bottom")
            ? "justify-end"
            : "justify-center";
    const horizontal = textPosition.includes("left")
        ? "items-start text-left"
        : textPosition.includes("right")
            ? "items-end text-right"
            : "items-center text-center";

    const textColor = textTheme === "dark" ? "#1c1512" : "#ffffff";
    const textShadow =
        textTheme === "dark"
            ? "0 1px 3px rgba(255,255,255,.5)"
            : "0 1px 3px rgba(0,0,0,.45)";

    const inner = (
        <div className="relative w-full aspect-[2/1] overflow-hidden md:aspect-[3/1]">
            <picture className="block h-full w-full">
                <source media="(min-width: 768px)" srcSet={banner.desktopSrc} />
                <img
                    src={banner.mobileSrc}
                    alt={banner.title || ""}
                    className="h-full w-full object-cover"
                />
            </picture>

            {/* gradiente direcional para contraste do texto, só no lado do texto */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{ background: gradient }}
            />

            <div
                className={`absolute inset-0 flex flex-col gap-3 px-6 py-6 md:px-10 md:py-10 ${vertical} ${horizontal}`}
            >
                {banner.title && (
                    <h2
                        className="text-2xl font-semibold uppercase tracking-wide md:text-4xl"
                        style={{ color: textColor, textShadow }}
                    >
                        {banner.title}
                    </h2>
                )}
                {banner.subtitle && (
                    <p
                        className="max-w-2xl text-sm md:text-lg"
                        style={{ color: textColor, textShadow }}
                    >
                        {banner.subtitle}
                    </p>
                )}
                {banner.href && (
                    <span className="mt-1 inline-block rounded-full bg-[#8C2F39] px-6 py-2 text-sm font-medium text-white shadow-md">
                        Ver produtos
                    </span>
                )}
            </div>
        </div>
    );

    if (banner.href) {
        return (
            <Link href={banner.href} className="block cursor-pointer">
                {inner}
            </Link>
        );
    }

    return inner;
}
