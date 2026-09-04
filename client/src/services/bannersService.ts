import { apiGet } from "./api";
import type {
  CategoryBanner,
  HeroSlideRow,
  HomeBanners,
  HomeSections,
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

  const title = row.title ?? null;
  const subtitle = row.subtitle ?? null;
  const textPosition = row.textPosition ?? "center-center";
  const textTheme = row.textTheme ?? "light";
  const textPositionMobile = row.textPositionMobile ?? null;
  const textThemeMobile = row.textThemeMobile ?? null;
  const focal = row.focal ?? "center";

  if (row.type === "video") {
    return {
      type: "video",
      src: row.src,
      poster: row.poster ?? null,
      title,
      subtitle,
      textPosition,
      textTheme,
      textPositionMobile,
      textThemeMobile,
      focal,
      cta,
    };
  }

  return {
    type: "image",
    src: row.src,
    srcMobile: row.srcMobile ?? null,
    alt: row.alt ?? "",
    title,
    subtitle,
    textPosition,
    textTheme,
    textPositionMobile,
    textThemeMobile,
    focal,
    cta,
  };
}

function mapIntermediateBanner(value: any): IntermediateBanner | null {
  if (!value?.src) return null;
  return {
    src: value.src,
    srcMobile: value.srcMobile ?? null,
    alt: value.alt ?? "",
    href: value.href || undefined,
    title: value.title || undefined,
    subtitle: value.subtitle || undefined,
    ctaText: value.ctaText || undefined,
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
      // só bloco com imagem e não desativado; ordem definida no painel
      .filter((img: any) => img?.src && img?.active !== false)
      .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0))
      .map((img: any) => ({
        src: img.src,
        srcMobile: img.srcMobile ?? null,
        alt: img.alt ?? "",
        href: img.href || undefined,
        title: img.title || undefined,
      })),
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

// Banner do topo da página de categoria: settings.home_category_banners é um
// ARRAY; escolhe o item cujo categorySlug bate e que não está desativado.
export async function getCategoryBanner(
  slug: string,
): Promise<CategoryBanner | null> {
  const settingsMap = await apiGet<Record<string, any>>("/api/store/settings");
  const list = settingsMap?.home_category_banners;
  if (!Array.isArray(list)) return null;

  const found = list.find(
    (b: any) => b?.categorySlug === slug && b?.active !== false,
  );
  if (!found || (!found.desktopSrc && !found.mobileSrc)) return null;

  return {
    categorySlug: found.categorySlug,
    // desktop cai pro mobile se faltar, e vice-versa
    desktopSrc: found.desktopSrc || found.mobileSrc || "",
    mobileSrc: found.mobileSrc || found.desktopSrc || "",
    title: found.title || "",
    subtitle: found.subtitle || "",
    href: found.href || "",
    active: found.active !== false,
    textPosition: found.textPosition || "bottom-left",
    textTheme: found.textTheme === "dark" ? "dark" : "light",
  };
}

// Curadoria da vitrine (settings.home_sections): listas ordenadas de IDs por
// seção. Ausência/ formato inválido => listas vazias => home usa o automático.
function mapCuratedSections(value: any): HomeSections {
  const list = (v: any): string[] =>
    Array.isArray(v) ? v.filter((id) => typeof id === "string") : [];
  return {
    lancamentos: list(value?.lancamentos),
    maisVendidos: list(value?.maisVendidos),
    outlet: list(value?.outlet),
  };
}

export async function getHomeSections(): Promise<HomeSections> {
  const settingsMap = await apiGet<Record<string, any>>("/api/store/settings");
  return mapCuratedSections(settingsMap?.home_sections);
}

// Categoria-fonte de cada fileira da home (settings.home_section_categories):
// cada valor é o SLUG de uma categoria; vazio/ausente => seção não configurada.
export type HomeSectionCategories = {
  lancamentos: string;
  maisVendidos: string;
  outlet: string;
};

// DEFAULTS aplicados APENAS quando a chave inteira está ausente.
const HOME_SECTION_CATEGORIES_DEFAULT: HomeSectionCategories = {
  lancamentos: "lancamentos",
  maisVendidos: "mais-vendidos",
  outlet: "outlet",
};

function mapHomeSectionCategories(value: any): HomeSectionCategories {
  // chave inteira ausente/ inválida => usa os defaults
  if (!value || typeof value !== "object") {
    return { ...HOME_SECTION_CATEGORIES_DEFAULT };
  }
  // chave presente => cada campo vazio significa seção não configurada ([])
  const slug = (v: any): string => (typeof v === "string" ? v.trim() : "");
  return {
    lancamentos: slug(value.lancamentos),
    maisVendidos: slug(value.maisVendidos),
    outlet: slug(value.outlet),
  };
}

export async function getHomeSectionCategories(): Promise<HomeSectionCategories> {
  const settingsMap = await apiGet<Record<string, any>>("/api/store/settings");
  return mapHomeSectionCategories(settingsMap?.home_section_categories);
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
