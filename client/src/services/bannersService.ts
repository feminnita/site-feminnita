import { apiGet } from "./api";
import type {
  HeroSlideRow,
  HomeBanners,
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
  };
}
