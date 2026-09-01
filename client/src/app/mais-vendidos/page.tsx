import { LandingPage } from "../../components/common/LandingPage";
import { fetchProducts } from "../../services/productsService";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Mais Vendidos | Feminnita",
    description:
        "Os queridinhos das clientes Feminnita. As peças mais vendidas da loja.",
};

export const revalidate = 300;

export default async function MaisVendidosPage() {
    const products = (await fetchProducts())
        .filter((p) => p.isBestseller)
        .slice(0, 24);

    return <LandingPage title="Mais Vendidos" products={products} />;
}
