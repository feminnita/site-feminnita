import { apiGet } from "./api";
import type {
  HeroSlideRow,
  HomeBanners,
  HomeSectionTitles,
  ImageGrid,
  IntermediateBanner,
  Slide,
  VideoSection,
} from "../types/banners/banners";

function mapSlideRow(row: HeroSlideRow): Slide {
  const cta =
    row.ctaText && row.ctaHref
      ? {
        text: row.ctaText,
        href: row.ctaHref,
      }
      : undefined;

  if (row.type === "video") {
    return {
      type: "video",
      src: row.src,
      poster: row.poster ?? null,
      cta,
    };
  }

  return {
    type: "image",
    src: row.src,
    srcMobile: row.srcMobile ?? null,
    alt: row.alt ?? "",
    cta,
  };
}

function mapIntermediateBanner(value: any): IntermediateBanner | null {
  if (!value?.src) return null;
  return {
    src: value.src,
    alt: value.alt ?? "",
    href: value.href || undefined,
  };
}

function mapVideoSection(value: any): VideoSection | null {
  if (!value?.desktopUrl) return null;
  return {
    desktopUrl: value.desktopUrl,
    mobileUrl: value.mobileUrl ?? "",
    href: value.href || undefined,
  };
}

function mapImageGrid(value: any): ImageGrid {
  const images = Array.isArray(value?.images) ? value.images : [];
  return {
    images: images
      .filter((img: any) => img?.src)
      .map((img: any) => ({ src: img.src, alt: img.alt ?? "" })),
  };
}

// títulos das seções da home vêm de settings (home_section_titles); default = textos originais
function mapHomeSections(
  value: Partial<HomeSectionTitles> | null | undefined,
): HomeSectionTitles {
  return {
    lancamentos: value?.lancamentos || "Lançamentos",
    maisVendidos: value?.maisVendidos || "Mais Vendidos",
    outlet: value?.outlet || "Outlet",
    outletSubtitle: value?.outletSubtitle || "até 50% OFF",
  };
}

export async function getHomeBanners(): Promise<HomeBanners> {
  const [slides, settingsMap] = await Promise.all([
    apiGet<HeroSlideRow[]>("/api/store/hero-slides"),
    apiGet<Record<string, any>>("/api/store/settings"),
  ]);

  return {
    slides: (slides ?? []).map(mapSlideRow),
    intermediateBanner: mapIntermediateBanner(
      settingsMap?.home_intermediate_banner,
    ),
    videoSection: mapVideoSection(settingsMap?.home_video_section),
    imageGrid: mapImageGrid(settingsMap?.home_image_grid),
    sections: mapHomeSections(settingsMap?.home_section_titles),
  };
}
