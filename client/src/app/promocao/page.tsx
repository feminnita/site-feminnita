import { LandingPage } from "../../components/common/LandingPage";
import { fetchProducts } from "../../services/productsService";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Promoção | Feminnita",
    description:
        "As melhores ofertas. Aproveite os descontos exclusivos Feminnita.",
};

export const revalidate = 300;

export default async function PromocaoPage() {
    const products = (await fetchProducts())
        .filter((p) => p.salePrice !== null && p.salePrice < p.price)
        .sort(
            (a, b) => (a.salePrice ?? a.price) / a.price - (b.salePrice ?? b.price) / b.price,
        )
        .slice(0, 24);

    return (
        <LandingPage
            theme="promo"
            title="PROMOÇÃO"
            subtitle="Peças selecionadas com desconto especial"
            badge="Oferta por tempo limitado"
            accentColor="#C41E3A"
            products={products}
        />
    );
}
