export type Slide =
    | {
        type: "image";
        src: string;
        srcMobile: string | null;
        alt: string;
        title?: string | null;
        subtitle?: string | null;
        textPosition?: string | null;
        focal?: string | null;
        cta?: {
            text: string;
            href: string;
        };
    }
    | {
        type: "video";
        src: string;
        poster: string | null;
        title?: string | null;
        subtitle?: string | null;
        textPosition?: string | null;
        focal?: string | null;
        cta?: {
            text: string;
            href: string;
        };
    };

export type HeroSlideRow = {
    type: string;
    src: string;
    srcMobile: string | null;
    alt: string | null;
    poster: string | null;
    ctaText: string | null;
    ctaHref: string | null;
    title?: string | null;
    subtitle?: string | null;
    textPosition?: string | null;
    focal?: string | null;
    orderIndex: number;
    active: boolean;
};

export type IntermediateBanner = {
    src: string;
    alt: string;
    href?: string;
    title?: string;
    subtitle?: string;
    ctaText?: string;
};

export type VideoSection = {
    desktopUrl: string;
    mobileUrl: string;
    href?: string;
};

export type ImageGridItem = {
    src: string;
    alt: string;
    href?: string;
    title?: string;
};

export type ImageGrid = {
    images: ImageGridItem[];
};

export type CategoryBanner = {
    categorySlug: string;
    desktopSrc: string;
    mobileSrc: string;
    title: string;
    subtitle: string;
    href: string;
    active: boolean;
    textPosition?: string;
    textTheme?: "light" | "dark";
};

export type HomeSectionTitles = {
    lancamentos: string;
    maisVendidos: string;
    outlet: string;
    outletSubtitle: string;
};

export type HomeBanners = {
    slides: Slide[];
    intermediateBanner: IntermediateBanner | null;
    videoSection: VideoSection | null;
    imageGrid: ImageGrid;
    sections: HomeSectionTitles;
};
