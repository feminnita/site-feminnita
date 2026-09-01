import { LandingPage } from "../../components/common/LandingPage";
import { fetchProducts } from "../../services/productsService";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Lançamentos | Feminnita",
    description:
        "Confira as novidades da Feminnita. As últimas peças acabaram de chegar.",
};

export const revalidate = 300;

export default async function LancamentosPage() {
    const products = (await fetchProducts()).filter((p) => p.isNew).slice(0, 24);

    return (
        <LandingPage
            theme="launch"
            title="LANÇAMENTOS"
            subtitle="As novidades mais recentes chegaram"
            badge="Nova coleção"
            accentColor="#8C2F39"
            products={products}
        />
    );
}
