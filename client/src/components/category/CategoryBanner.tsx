import Link from "next/link";
import type { CategoryBanner as CategoryBannerType } from "../../types/banners/banners";

export function CategoryBanner({ banner }: { banner: CategoryBannerType }) {
    // desktop >=768 baixa desktopSrc; abaixo disso, mobileSrc. <picture>/media
    // garante que só a imagem certa por largura é baixada (igual ao HeroCarousel).
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

            {/* scrim para o texto ter contraste sobre a imagem */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
                {banner.title && (
                    <h2 className="text-2xl font-semibold uppercase tracking-wide text-white drop-shadow-md md:text-4xl">
                        {banner.title}
                    </h2>
                )}
                {banner.subtitle && (
                    <p className="max-w-2xl text-sm text-white/90 drop-shadow md:text-lg">
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
