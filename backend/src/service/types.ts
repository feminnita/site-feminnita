import type { ResolvedSizeChart } from './SizeChart.Service';

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
    active: boolean;
    stock: number;
    view_count: number;
    sizeChart?: ResolvedSizeChart;
};
