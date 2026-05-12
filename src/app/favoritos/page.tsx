"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Heart } from "lucide-react";
import { fetchProducts, type StoreProduct } from "@/lib/products";

export default function FavoritosPage() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<StoreProduct[]>([]);
  const [allProducts, setAllProducts] = useState<StoreProduct[]>([]);

  useEffect(() => {
    fetchProducts().then((data) => {
      setAllProducts(data);
    }).catch(() => {});

    const handleFavoritesUpdate = () => loadFavorites();
    window.addEventListener("favoritesUpdated", handleFavoritesUpdate);
    return () => window.removeEventListener("favoritesUpdated", handleFavoritesUpdate);
  }, []);

  useEffect(() => {
    if (allProducts.length) loadFavorites();
  }, [allProducts]);

  const loadFavorites = () => {
    const saved = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(saved);
    setFavoriteProducts(allProducts.filter((p) => saved.includes(p.id)));
  };

  const clearAll = () => {
    if (confirm("Tem certeza que deseja remover todos os favoritos?")) {
      localStorage.setItem("favorites", JSON.stringify([]));
      setFavorites([]);
      setFavoriteProducts([]);
      window.dispatchEvent(new Event("favoritesUpdated"));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-light mb-2">Meus Favoritos</h1>
            <p className="text-gray-600">
              {favoriteProducts.length}{" "}
              {favoriteProducts.length === 1 ? "produto salvo" : "produtos salvos"}
            </p>
          </div>

          {favoriteProducts.length > 0 && (
            <button
              onClick={clearAll}
              className="text-red-600 hover:text-red-800 font-medium"
            >
              Limpar Tudo
            </button>
          )}
        </div>

        {favoriteProducts.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-2xl font-light mb-4">
              Você ainda não tem favoritos
            </h2>
            <p className="text-gray-600 mb-6">
              Salve produtos que você gostou para visualizar depois!
            </p>
            <Link href="/produtos">
              <button className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800">
                Explorar Produtos
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {favoriteProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
