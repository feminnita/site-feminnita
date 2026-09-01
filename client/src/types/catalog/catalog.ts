import type { CategoryNode } from "../../types/categories/categories";
import type { ReactNode } from "react";

export type ParsedQuery = {
  text: string;
  colors: string[];
  sizes: string[];
  categories: string[];
  fabrics: string[];
};

export type SortOption = "relevance" | "price-asc" | "price-desc" | "name";

export type ProductFilters = {
  query: string;
  category: string;
  colors: string[];
  sizes: string[];
  maxPrice: number;
  sort: SortOption;
};

export type CatalogFacets = {
  colors: string[];
  categories: string[];
  sizes: string[];
};

export type PropsSearchBar = {
  query: string;
  onChange: (value: string) => void;
};

export type PropsSuggestionsChips = {
  visible: boolean;
  onSelect: (value: string) => void;
};

export type PropsFilterPanel = {
  categoryTree: CategoryNode[];
  category: string;
  onCategoryChange: (value: string) => void;
  availableSizes: string[];
  sizes: string[];
  onToggleSize: (size: string) => void;
  maxPrice: number;
  maxPriceLimit: number;
  onMaxPriceChange: (value: number) => void;
  activeCount: number;
  onClearAll: () => void;
  // colorSwatches: ColorSwatch[];
  // colors: string[];
  // onToggleColor: (name: string) => void;
};

export type PropsToolbar = {
  resultCount: number;
  activeCount: number;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onOpenFilters: () => void;
};

export type PropsMobileFilterSheet = {
  open: boolean;
  onClose: () => void;
  resultCount: number;
  children: ReactNode;
};

export type PropsCategoryFilterAccordion = {
  items: CategoryNode[];
  selectedCategory: string;
  onSelect: (name: string) => void;
};
