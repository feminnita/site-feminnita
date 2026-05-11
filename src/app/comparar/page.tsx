"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import Link from "next/link";
import Image from "next/image";
import { X, ShoppingCart } from "lucide-react";
import productsData from "@/data/products.json";

export default function CompararPage() {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareProducts, setCompareProducts] = useState<any[]>([]);

  useEffect(() => {
    loadComparison();

    const handleCompareUpdate = () => loadComparison();
    window.addEventListener("compareUpdated", handleCompareUpdate);

    return () => window.removeEventListener("compareUpdated", handleCompareUpdate);
  }, []);

  const loadComparison = () => {
    const saved = JSON.parse(localStorage.getItem("compare") || "[]");
    setCompareIds(saved);

    const products = productsData.filter((p) => saved.includes(p.id));
    setCompareProducts(products);
  };

  const removeProduct = (productId: string) => {
    const updated = compareIds.filter((id) => id !== productId);
    localStorage.setItem("compare", JSON.stringify(updated));
    setCompareIds(updated);
    setCompareProducts(compareProducts.filter((p) => p.id !== productId));
    window.dispatchEvent(new Event("compareUpdated"));
  };

  const clearAll = () => {
    localStorage.setItem("compare", JSON.stringify([]));
    setCompareIds([]);
    setCompareProducts([]);
    window.dispatchEvent(new Event("compareUpdated"));
  };

  if (compareProducts.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-light mb-4">Comparar Produtos</h1>
          <p className="text-gray-600 mb-8">
            Você ainda não adicionou produtos para comparar
          </p>
          <Link href="/produtos">
            <button className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800">
              Ver Produtos
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-light">Comparar Produtos</h1>
          <button
            onClick={clearAll}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Limpar Comparação
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-4 text-left font-semibold">Produto</th>
                {compareProducts.map((product) => (
                  <th key={product.id} className="p-4 w-64">
                    <div className="relative">
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                      <div className="relative aspect-[2/3] mb-3">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <h3 className="font-semibold text-sm">{product.name}</h3>
                      <p className="text-xs text-gray-500">{product.code}</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-4 font-semibold">Preço PIX</td>
                {compareProducts.map((product) => (
                  <td key={product.id} className="p-4 text-center">
                    <span className="text-xl font-bold text-green-600">
                      R$ {product.pixPrice.toFixed(2)}
                    </span>
                  </td>
                ))}
              </tr>

              <tr className="border-t bg-gray-50">
                <td className="p-4 font-semibold">Preço Normal</td>
                {compareProducts.map((product) => (
                  <td key={product.id} className="p-4 text-center">
                    R$ {product.price.toFixed(2)}
                  </td>
                ))}
              </tr>

              <tr className="border-t">
                <td className="p-4 font-semibold">Parcelamento</td>
                {compareProducts.map((product) => (
                  <td key={product.id} className="p-4 text-center text-sm">
                    {product.installments}x de R${" "}
                    {product.installmentPrice.toFixed(2)}
                  </td>
                ))}
              </tr>

              <tr className="border-t bg-gray-50">
                <td className="p-4 font-semibold">Cores Disponíveis</td>
                {compareProducts.map((product) => (
                  <td key={product.id} className="p-4">
                    <div className="flex gap-1 justify-center flex-wrap">
                      {product.colors.map((color: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-gray-200 rounded text-xs"
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              <tr className="border-t">
                <td className="p-4 font-semibold">Tamanhos Disponíveis</td>
                {compareProducts.map((product) => (
                  <td key={product.id} className="p-4">
                    <div className="flex gap-1 justify-center flex-wrap">
                      {product.sizes.map((size: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-gray-200 rounded text-xs"
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              <tr className="border-t bg-gray-50">
                <td className="p-4 font-semibold">Categoria</td>
                {compareProducts.map((product) => (
                  <td key={product.id} className="p-4 text-center capitalize">
                    {product.category}
                  </td>
                ))}
              </tr>

              <tr className="border-t">
                <td className="p-4 font-semibold">Ação</td>
                {compareProducts.map((product) => (
                  <td key={product.id} className="p-4 text-center">
                    <Link href={`/produto/${product.id}`}>
                      <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2 mx-auto">
                        <ShoppingCart size={16} />
                        Ver Produto
                      </button>
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {compareProducts.length < 3 && (
          <div className="mt-8 p-6 bg-blue-50 rounded-lg text-center">
            <p className="text-blue-900">
              Você pode comparar até 3 produtos. Adicione mais produtos para comparar!
            </p>
            <Link href="/produtos">
              <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Ver Mais Produtos
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
