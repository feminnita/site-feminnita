"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Edit, Trash2, Save, X, Package } from "lucide-react";

export default function ProdutosPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm]);

  const loadProducts = async () => {
    const response = await fetch("/data/products.json");
    const data = await response.json();
    setProducts(data);
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleEdit = (product: any) => {
    setEditingProduct({ ...product });
    setIsEditing(true);
  };

  const handleNew = () => {
    setEditingProduct({
      id: (products.length + 1).toString(),
      code: `TP${Math.random().toString().slice(2, 7)}`,
      name: "",
      price: 0,
      pixPrice: 0,
      installments: 10,
      installmentPrice: 0,
      category: "tops",
      images: [],
      colors: [],
      sizes: ["PP", "P", "M", "G", "GG"],
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    // Calculate PIX price and installment price
    const pixPrice = editingProduct.price * 0.9;
    const installmentPrice = editingProduct.price / editingProduct.installments;

    const updatedProduct = {
      ...editingProduct,
      pixPrice,
      installmentPrice,
      price: parseFloat(editingProduct.price),
    };

    const existingIndex = products.findIndex((p) => p.id === updatedProduct.id);

    let updatedProducts;
    if (existingIndex >= 0) {
      updatedProducts = [...products];
      updatedProducts[existingIndex] = updatedProduct;
    } else {
      updatedProducts = [...products, updatedProduct];
    }

    setProducts(updatedProducts);

    // Save to localStorage (in production, save to backend)
    localStorage.setItem("products", JSON.stringify(updatedProducts));

    alert("Produto salvo! ATENÇÃO: Em produção, os dados devem ser salvos no backend e no arquivo products.json");
    setIsEditing(false);
    setEditingProduct(null);
  };

  const handleDelete = (productId: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      const updatedProducts = products.filter((p) => p.id !== productId);
      setProducts(updatedProducts);
      localStorage.setItem("products", JSON.stringify(updatedProducts));
      alert("Produto excluído!");
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditingProduct({ ...editingProduct, [field]: value });
  };

  const handleArrayChange = (field: string, value: string) => {
    const array = value.split(",").map((item) => item.trim()).filter((item) => item);
    setEditingProduct({ ...editingProduct, [field]: array });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Gestão de Produtos</h1>
          <Link href="/admin/dashboard" className="text-blue-600 hover:underline">
            ← Voltar ao Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {!isEditing ? (
          <>
            {/* Stats & Actions */}
            <div className="flex justify-between items-center mb-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-sm text-gray-600">Total de Produtos</div>
                <div className="text-3xl font-bold mt-2">{products.length}</div>
              </div>

              <button
                onClick={handleNew}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2 shadow-lg"
              >
                <Plus size={20} />
                Novo Produto
              </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por nome ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Image */}
                  <div className="relative aspect-[2/3] bg-gray-100">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={48} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p className="text-xs text-gray-500 uppercase">{product.code}</p>
                    <h3 className="font-semibold mt-1 mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-lg font-bold text-green-600 mb-1">
                      R$ {product.price.toFixed(2).replace(".", ",")}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      PIX: R$ {product.pixPrice.toFixed(2).replace(".", ",")}
                    </p>

                    {/* Colors */}
                    <div className="flex gap-1 mb-3">
                      {product.colors.slice(0, 5).map((color: string, index: number) => (
                        <div
                          key={index}
                          className="w-6 h-6 rounded-full border"
                          style={{
                            backgroundColor: color.toLowerCase() === "branco" ? "#FFF" :
                                           color.toLowerCase() === "preto" ? "#000" : "#CCC"
                          }}
                          title={color}
                        />
                      ))}
                      {product.colors.length > 5 && (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                          +{product.colors.length - 5}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-1"
                      >
                        <Edit size={16} />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
                <Package size={64} className="mx-auto mb-4" />
                <p className="text-lg">Nenhum produto encontrado</p>
              </div>
            )}
          </>
        ) : (
          /* Edit Form */
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {products.find((p) => p.id === editingProduct.id) ? "Editar" : "Novo"} Produto
              </h2>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingProduct(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Código do Produto</label>
                  <input
                    type="text"
                    value={editingProduct.code}
                    onChange={(e) => handleInputChange("code", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="TP10527"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Categoria</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="tops">Tops</option>
                    <option value="leggings">Leggings</option>
                    <option value="shorts">Shorts</option>
                    <option value="conjuntos">Conjuntos</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Nome do Produto</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Top Rose Drift"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="119.50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    PIX (10% OFF): R$ {(editingProduct.price * 0.9).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Parcelas</label>
                  <input
                    type="number"
                    value={editingProduct.installments}
                    onChange={(e) => handleInputChange("installments", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editingProduct.installments}x de R${" "}
                    {(editingProduct.price / editingProduct.installments).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium mb-2">URLs das Imagens (separadas por vírgula)</label>
                <textarea
                  value={editingProduct.images.join(", ")}
                  onChange={(e) => handleArrayChange("images", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                  placeholder="https://exemplo.com/imagem1.jpg, https://exemplo.com/imagem2.jpg"
                />
              </div>

              {/* Colors */}
              <div>
                <label className="block text-sm font-medium mb-2">Cores (separadas por vírgula)</label>
                <input
                  type="text"
                  value={editingProduct.colors.join(", ")}
                  onChange={(e) => handleArrayChange("colors", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="rose, mint, preto, branco"
                />
              </div>

              {/* Sizes */}
              <div>
                <label className="block text-sm font-medium mb-2">Tamanhos (separados por vírgula)</label>
                <input
                  type="text"
                  value={editingProduct.sizes.join(", ")}
                  onChange={(e) => handleArrayChange("sizes", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="PP, P, M, G, GG"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Salvar Produto
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditingProduct(null);
                  }}
                  className="px-6 py-3 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>IMPORTANTE:</strong> Os dados estão sendo salvos apenas no localStorage.
                  Para produção, você deve implementar um backend que salve os dados no arquivo
                  <code className="bg-yellow-100 px-2 py-1 rounded mx-1">src/data/products.json</code>
                  e em um banco de dados.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
