"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Ruler, User, Camera, RotateCcw, ShoppingCart, Info } from "lucide-react";
import productsData from "@/data/products.json";

type BodyType = "petite" | "athletic" | "curvy" | "plus";

const bodyTypes = [
  {
    id: "petite" as BodyType,
    name: "Petite",
    description: "Estrutura delicada, altura baixa a média",
    measurements: "Busto: 80-85cm | Cintura: 60-65cm | Quadril: 85-90cm"
  },
  {
    id: "athletic" as BodyType,
    name: "Atlético",
    description: "Ombros definidos, cintura reta",
    measurements: "Busto: 85-90cm | Cintura: 68-73cm | Quadril: 90-95cm"
  },
  {
    id: "curvy" as BodyType,
    name: "Curvy",
    description: "Curvas acentuadas, cintura marcada",
    measurements: "Busto: 90-98cm | Cintura: 70-78cm | Quadril: 98-106cm"
  },
  {
    id: "plus" as BodyType,
    name: "Plus Size",
    description: "Curvas generosas, conforto prioritário",
    measurements: "Busto: 100-110cm | Cintura: 85-95cm | Quadril: 110-120cm"
  }
];

const sizeGuide = {
  tops: [
    { size: "PP", bust: "78-82", waist: "58-62", hip: "84-88" },
    { size: "P", bust: "82-86", waist: "62-66", hip: "88-92" },
    { size: "M", bust: "86-90", waist: "66-70", hip: "92-96" },
    { size: "G", bust: "90-94", waist: "70-74", hip: "96-100" },
    { size: "GG", bust: "94-100", waist: "74-80", hip: "100-106" },
  ],
  leggings: [
    { size: "PP", waist: "58-62", hip: "84-88", height: "152-160" },
    { size: "P", waist: "62-66", hip: "88-92", height: "158-166" },
    { size: "M", waist: "66-70", hip: "92-96", height: "164-172" },
    { size: "G", waist: "70-74", hip: "96-100", height: "170-178" },
    { size: "GG", waist: "74-80", hip: "100-106", height: "176-184" },
  ]
};

export default function ProvadorPage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("produto");

  const [product, setProduct] = useState<any>(null);
  const [selectedBodyType, setSelectedBodyType] = useState<BodyType>("athletic");
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState("");
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [viewMode, setViewMode] = useState<"front" | "side" | "back">("front");

  useEffect(() => {
    if (productId) {
      const foundProduct = productsData.find(p => p.id === productId);
      if (foundProduct) {
        setProduct(foundProduct);
        setSelectedColor(foundProduct.colors[0]);
      }
    }
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;

    const cartItem = {
      ...product,
      selectedSize,
      selectedColor,
      quantity: 1,
    };

    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    existingCart.push(cartItem);
    localStorage.setItem("cart", JSON.stringify(existingCart));
    window.dispatchEvent(new Event("cartUpdated"));

    alert(`${product.name} (${selectedSize}, ${selectedColor}) adicionado ao carrinho!`);
  };

  const colorMap: { [key: string]: string } = {
    rose: "#D4A5A5",
    mint: "#A8D5BA",
    aloe: "#C8E6C9",
    hazel: "#B8A68F",
    cream: "#F5E6D3",
    mescla: "#9E9E9E",
    branco: "#FFFFFF",
    preto: "#000000",
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <Camera size={64} className="mx-auto mb-4 text-gray-300" />
            <h1 className="text-3xl font-light mb-4">Provador Virtual</h1>
            <p className="text-gray-600 mb-8">
              Selecione um produto para experimentar virtualmente
            </p>
            <Link href="/produtos">
              <button className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800">
                Ver Produtos
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-2 flex items-center gap-3">
            <Camera size={32} />
            Provador Virtual
          </h1>
          <p className="text-gray-600">
            Visualize como o produto fica em diferentes tipos de corpo
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Body Type & Settings */}
          <div className="space-y-6">
            {/* Body Type Selector */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <User size={20} />
                Tipo de Corpo
              </h3>
              <div className="space-y-3">
                {bodyTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedBodyType(type.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedBodyType === type.id
                        ? "border-black bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold mb-1">{type.name}</div>
                    <div className="text-sm text-gray-600 mb-2">{type.description}</div>
                    <div className="text-xs text-gray-500">{type.measurements}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div className="bg-white rounded-lg p-6 shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Ruler size={20} />
                  Tamanho
                </h3>
                <button
                  onClick={() => setShowSizeGuide(!showSizeGuide)}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Info size={16} />
                  Guia
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-4">
                {product.sizes.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 rounded-lg font-semibold transition-all ${
                      selectedSize === size
                        ? "bg-black text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {showSizeGuide && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 text-sm">Guia de Medidas (cm)</h4>
                  <div className="text-xs space-y-2">
                    {sizeGuide.tops.map((guide) => (
                      <div key={guide.size} className="flex justify-between py-2 border-b">
                        <span className="font-semibold">{guide.size}</span>
                        <span className="text-gray-600">
                          Busto: {guide.bust} | Cintura: {guide.waist}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Color Selector */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-semibold text-lg mb-4">Cor</h3>
              <div className="flex gap-3 flex-wrap">
                {product.colors.map((color: string) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-12 h-12 rounded-full border-2 transition-all ${
                      selectedColor === color
                        ? "border-black scale-110 ring-2 ring-offset-2 ring-black"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    style={{
                      backgroundColor: colorMap[color.toLowerCase()] || "#CCCCCC",
                    }}
                    title={color}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Cor selecionada: <strong>{selectedColor}</strong>
              </p>
            </div>
          </div>

          {/* Center: Visualization */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* View Mode Tabs */}
              <div className="flex border-b">
                <button
                  onClick={() => setViewMode("front")}
                  className={`flex-1 py-4 font-semibold transition-colors ${
                    viewMode === "front"
                      ? "bg-black text-white"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  Frente
                </button>
                <button
                  onClick={() => setViewMode("side")}
                  className={`flex-1 py-4 font-semibold transition-colors ${
                    viewMode === "side"
                      ? "bg-black text-white"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  Lateral
                </button>
                <button
                  onClick={() => setViewMode("back")}
                  className={`flex-1 py-4 font-semibold transition-colors ${
                    viewMode === "back"
                      ? "bg-black text-white"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  Costas
                </button>
              </div>

              {/* Product Visualization */}
              <div className="p-8 bg-gray-50">
                <div className="relative aspect-[3/4] bg-white rounded-lg overflow-hidden mb-4">
                  <Image
                    src={product.images[viewMode === "back" ? 1 : 0] || product.images[0]}
                    alt={`${product.name} - ${viewMode}`}
                    fill
                    className="object-cover"
                  />

                  {/* Body type overlay indicator */}
                  <div className="absolute top-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg text-sm">
                    Tipo: {bodyTypes.find(b => b.id === selectedBodyType)?.name}
                  </div>
                </div>

                {/* Product Info */}
                <div className="bg-white p-6 rounded-lg">
                  <h2 className="text-2xl font-light mb-2">{product.name}</h2>
                  <p className="text-sm text-gray-500 mb-4">{product.code}</p>

                  <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-3xl font-bold">
                      R$ {product.pixPrice.toFixed(2).replace(".", ",")}
                    </span>
                    <span className="text-sm text-green-600 font-semibold">
                      no PIX (10% OFF)
                    </span>
                  </div>

                  {/* Selection Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold mb-3">Sua Seleção:</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tamanho:</span>
                        <span className="font-semibold">{selectedSize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cor:</span>
                        <span className="font-semibold">{selectedColor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tipo de Corpo:</span>
                        <span className="font-semibold">
                          {bodyTypes.find(b => b.id === selectedBodyType)?.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={20} />
                      Adicionar ao Carrinho
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBodyType("athletic");
                        setSelectedSize("M");
                        setViewMode("front");
                      }}
                      className="px-6 py-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Resetar"
                    >
                      <RotateCcw size={20} />
                    </button>
                  </div>

                  <Link href={`/produto/${product.id}`}>
                    <button className="w-full mt-3 text-sm text-blue-600 hover:underline">
                      Ver página completa do produto →
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold mb-3 text-blue-900">💡 Dicas do Provador Virtual</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Selecione seu tipo de corpo para uma melhor visualização</li>
                <li>• Consulte o guia de medidas para escolher o tamanho ideal</li>
                <li>• Experimente diferentes cores para ver qual combina mais com você</li>
                <li>• Use as visualizações frontal, lateral e traseira para ver todos os ângulos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
