import type { ResolvedSizeChart } from './SizeChart.Service';

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
    saleStart: string | null;
    saleEnd: string | null;
    // Etiqueta da promoção especial (Black Friday, lançamento...) — só vem enquanto está no ar.
    promo: { selo: string; fim: string | null } | null;
    // "Chegou reposição": só vem enquanto vale (7 dias a partir do clique no painel).
    reposicao: { ate: string; cores: string[] } | null;
    installments: number;
    installmentPrice: number;
    images: string[];
    colorImages: Record<string, string[]>;
    videoUrl: string | null;
    colors: string[];
    sizes: string[];
    // Subconjunto de colors/sizes com estoque de verdade. A vitrine usa estes;
    // a pagina do produto e a tabela de medidas continuam na lista completa.
    availableColors: string[];
    availableSizes: string[];
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
    metaTitle: string | null;
    metaDescription: string | null;
    sizeChart?: ResolvedSizeChart;
};
