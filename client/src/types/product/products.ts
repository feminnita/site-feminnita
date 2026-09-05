import type { RefObject } from "react";

export type ResolvedSizeChartRow = {
  label: string;
  equiv: string | null;
  values: (string | number)[];
};

export type ResolvedSizeChart = {
  source: "product" | "category";
  name: string;
  columns: string[];
  footer: string;
  rows: ResolvedSizeChartRow[];
  howToMeasureImage?: string;
};

export type Review = {
  author: string;
  date: string;
  rating: number;
  comment: string;
};

export type StoreProduct = {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  pixPrice: number;
  salePrice: number | null;
  installments: number;
  installmentPrice: number;
  images: string[];
  colorImages: Record<string, string[]>;
  videoUrl: string | null;
  colors: string[];
  sizes: string[];
  category: string;
  category_id: string | null;
  featured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  isOutlet: boolean;
  active: boolean;
  stock: number;
  view_count: number;
  reviews: Review[];
  sizeChart?: ResolvedSizeChart;
};

export type CartItemInput = {
  product: StoreProduct;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
};

export type ProductGalleryProps = {
  productName: string;
  images: string[];
  videoUrl: string | null;
  selectedImage: number;
  onSelectImage: (index: number) => void;
  showVideo: boolean;
  onShowVideo: () => void;
  embedUrl: string;
};

export type ColorSelectorProps = {
  colors: string[];
  selectedColor: string;
  onSelect: (color: string) => void;
  colorImages?: Record<string, string[]>;
};

export type SizeSelectorProps = {
  productId: string;
  sizes: string[];
  selectedSize: string;
  selectedColor: string;
  skus: SkuStock[];
  onSelect: (size: string) => void;
};

export type QuantitySelectorProps = {
  quantity: number;
  onChange: (quantity: number) => void;
};

export type ProductActionsProps = {
  ctaRef: RefObject<HTMLDivElement | null>;
  productId: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddToCart: () => void;
  disabled?: boolean;
};

export type StickyMobileCtaProps = {
  visible: boolean;
  productName: string;
  price: number;
  onAddToCart: () => void;
  disabled?: boolean;
};

export type PriceBlockProps = {
  price: number;
  salePrice: number | null;
  installments: number;
  installmentPrice: number;
};

export type ProductDescriptionProps = {
  productName: string;
  description: string;
};

export type SkuStock = {
  size: string;
  color: string | null;
  availableQty: number;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
};


export type SelectedProduct = {
  skus: SkuStock[];
  selectedSize: string;
  selectedColor?: string;
}