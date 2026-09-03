export type Slide =
    | {
        type: "image";
        src: string;
        srcMobile: string | null;
        alt: string;
        cta?: {
            text: string;
            href: string;
        };
    }
    | {
        type: "video";
        src: string;
        poster: string | null;
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
    orderIndex: number;
    active: boolean;
};

export type IntermediateBanner = {
    src: string;
    alt: string;
    href?: string;
};

export type VideoSection = {
    desktopUrl: string;
    mobileUrl: string;
    href?: string;
};

export type ImageGridItem = {
    src: string;
    alt: string;
};

export type ImageGrid = {
    images: ImageGridItem[];
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
