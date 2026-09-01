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
    const products = await fetchProducts({ isNew: true, withPhoto: true, limit: 24 });

    return <LandingPage title="Lançamentos" products={products} />;
}
