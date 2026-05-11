"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Filter, X } from "lucide-react";
import productsData from "@/data/products.json";

export default function ProdutosPage() {
  const [products, setProducts] = useState(productsData);
  const [filteredProducts, setFilteredProducts] = useState(productsData);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sortBy, setSortBy] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: "all", name: "Todos os Produtos" },
    { id: "tops", name: "Tops" },
    { id: "leggings", name: "Leggings" },
    { id: "shorts", name: "Shorts" },
    { id: "conjuntos", name: "Conjuntos" },
  ];

  const colors = [
    { id: "rose", name: "Rose", hex: "#D4A5A5" },
    { id: "mint", name: "Mint", hex: "#A8D5BA" },
    { id: "aloe", name: "Aloe", hex: "#C8E6C9" },
    { id: "hazel", name: "Hazel", hex: "#B8A68F" },
    { id: "preto", name: "Preto", hex: "#000000" },
    { id: "branco", name: "Branco", hex: "#FFFFFF" },
  ];

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedCategory, selectedColors, selectedSizes, priceRange, sortBy]);

  const applyFilters = () => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    // Color filter
    if (selectedColors.length > 0) {
      filtered = filtered.filter((product) =>
        product.colors.some((color) =>
          selectedColors.includes(color.toLowerCase())
        )
      );
    }

    // Size filter
    if (selectedSizes.length > 0) {
      filtered = filtered.filter((product) =>
        product.sizes.some((size) =>
          selectedSizes.includes(size)
        )
      );
    }

    // Price filter
    filtered = filtered.filter(
      (product) =>
        product.pixPrice >= priceRange.min && product.pixPrice <= priceRange.max
    );

    // Sorting
    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.pixPrice - b.pixPrice);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.pixPrice - a.pixPrice);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // relevance - keep original order
        break;
    }

    setFilteredProducts(filtered);
  };

  const toggleColor = (colorId: string) => {
    if (selectedColors.includes(colorId)) {
      setSelectedColors(selectedColors.filter((c) => c !== colorId));
    } else {
      setSelectedColors([...selectedColors, colorId]);
    }
  };

  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const sizes = ["PP", "P", "M", "G", "GG", "XG"];

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedColors([]);
    setPriceRange({ min: 0, max: 1000 });
    setSortBy("relevance");
  };

  const activeFiltersCount =
    (selectedCategory !== "all" ? 1 : 0) +
    selectedColors.length +
    (priceRange.min > 0 || priceRange.max < 1000 ? 1 : 0);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light mb-4">Nossos Produtos</h1>
          <p className="text-gray-600">
            Encontre o look perfeito para seus treinos
          </p>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-6 py-3 border rounded-lg hover:bg-gray-50 flex items-center gap-2 relative"
          >
            <Filter size={20} />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black"
          >
            <option value="relevance">Relevância</option>
            <option value="price-asc">Menor Preço</option>
            <option value="price-desc">Maior Preço</option>
            <option value="name">A-Z</option>
          </select>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div
            className={`lg:col-span-1 ${
              showFilters ? "block" : "hidden lg:block"
            }`}
          >
            <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Filtros</h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Limpar Tudo
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Categoria</h4>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? "bg-black text-white"
                          : "hover:bg-gray-200"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Cores</h4>
                <div className="grid grid-cols-3 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => toggleColor(color.id)}
                      className={`aspect-square rounded-lg border-2 transition-all ${
                        selectedColors.includes(color.id)
                          ? "border-black scale-110"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColors.includes(color.id) && (
                        <span className="text-white text-xl">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Faixa de Preço</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Mínimo</label>
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange({
                          ...priceRange,
                          min: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg mt-1"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Máximo</label>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange({
                          ...priceRange,
                          max: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg mt-1"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex justify-between items-center">
              <p className="text-gray-600">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "produto encontrado" : "produtos encontrados"}
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-gray-400 mb-4">
                  Nenhum produto encontrado
                </p>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:underline"
                >
                  Limpar filtros e ver todos os produtos
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
