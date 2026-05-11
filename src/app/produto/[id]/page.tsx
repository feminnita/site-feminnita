"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { JsonLd, productSchema, breadcrumbSchema } from "@/components/JsonLd";
import { CompleteOLook } from "@/components/CompleteOLook";
import { ReviewSection } from "@/components/ReviewSection";
import { SizeRecommender } from "@/components/SizeRecommender";
import { StockIndicator } from "@/components/StockIndicator";
import { PersonalizedRecommendations } from "@/components/PersonalizedRecommendations";
import { ShoppingCart, Heart, Minus, Plus, Truck, RefreshCw, Shield, Check } from "lucide-react";
import productsData from "@/data/products.json";

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

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [toast, setToast] = useState("");
  const [stickyVisible, setStickyVisible] = useState(false);
  const mainCTARef = useRef<HTMLDivElement>(null);

  const product = productsData.find((p) => p.id === params.id);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  useEffect(() => {
    if (!mainCTARef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(mainCTARef.current);
    return () => obs.disconnect();
  }, [product]);

  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors[0] || "");

      // Track product view for analytics
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag('event', 'view_item', {
          currency: 'BRL',
          value: product.pixPrice,
          items: [{
            item_id: product.id,
            item_name: product.name,
            price: product.pixPrice,
            quantity: 1
          }]
        });
      }

      // Facebook Pixel - View Content
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq('track', 'ViewContent', {
          content_ids: [product.id],
          content_type: 'product',
          value: product.pixPrice,
          currency: 'BRL'
        });
      }
    }
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl mb-4">Produto não encontrado</h1>
          <Link href="/" className="text-blue-600 underline">
            Voltar para home
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      showToast("Selecione um tamanho");
      return;
    }

    const cartItem = {
      ...product,
      selectedSize,
      selectedColor,
      quantity,
    };

    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItemIndex = existingCart.findIndex(
      (item: any) =>
        item.id === product.id &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor
    );

    if (existingItemIndex > -1) {
      existingCart[existingItemIndex].quantity += quantity;
    } else {
      existingCart.push(cartItem);
    }

    localStorage.setItem("cart", JSON.stringify(existingCart));
    window.dispatchEvent(new Event("cartUpdated"));

    // Google Analytics - Add to Cart
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag('event', 'add_to_cart', {
        currency: 'BRL',
        value: product.pixPrice * quantity,
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: product.pixPrice,
          quantity: quantity
        }]
      });
    }

    // Facebook Pixel - Add to Cart
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq('track', 'AddToCart', {
        content_ids: [product.id],
        content_type: 'product',
        value: product.pixPrice * quantity,
        currency: 'BRL'
      });
    }

    showToast(`${quantity}x adicionado ao carrinho!`);
  };

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-0">
      <JsonLd data={productSchema(product)} />
      <JsonLd data={breadcrumbSchema([
        { name: "Home", url: "https://feminnita.com.br/" },
        { name: product.category, url: `https://feminnita.com.br/categoria/${product.category}` },
        { name: product.name, url: `https://feminnita.com.br/produto/${product.id}` },
      ])} />
      <Header />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-full text-sm shadow-lg animate-fade-in">
          <Check size={16} className="text-green-400" />
          {toast}
        </div>
      )}

      {/* Sticky CTA — mobile only */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t shadow-lg px-4 py-3 transition-transform duration-300 ${
          stickyVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 truncate">{product?.name}</p>
            <p className="font-bold text-[#8C2F39]">
              R$ {product?.pixPrice.toFixed(2).replace(".", ",")}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            className="flex items-center gap-2 bg-[#8C2F39] text-white px-5 py-3 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
          >
            <ShoppingCart size={18} />
            Adicionar
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:underline">Home</Link>
          {" / "}
          <Link href={`/categoria/${product.category}`} className="hover:underline">
            {product.category}
          </Link>
          {" / "}
          <span>{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="relative aspect-[2/3] bg-gray-100 mb-4 overflow-hidden">
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
                quality={85}
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-[2/3] bg-gray-100 overflow-hidden border-2 ${
                      selectedImage === index
                        ? "border-black"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-500 uppercase">{product.code}</p>
              <h1 className="text-3xl font-light mt-2">{product.name}</h1>
            </div>

            {/* Price */}
            <div className="border-t border-b py-4">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold">
                  R$ {product.pixPrice.toFixed(2).replace(".", ",")}
                </span>
                <span className="text-lg text-green-600 font-semibold">
                  10% OFF no PIX
                </span>
              </div>
              <p className="text-gray-600 mt-1">
                ou {product.installments}x de R${" "}
                {product.installmentPrice.toFixed(2).replace(".", ",")} sem juros
              </p>
            </div>

            {/* Color Selector */}
            {product.colors.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-3">
                  Cor: <span className="font-normal text-gray-600">{selectedColor}</span>
                </label>
                <div className="flex gap-3">
                  {product.colors.map((color) => (
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
              </div>
            )}

            {/* Size Selector */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Tamanho: {selectedSize && <span className="font-normal text-gray-600">{selectedSize}</span>}
              </label>
              <div className="flex flex-wrap gap-3 mb-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-6 py-3 border-2 rounded-lg font-medium transition-all ${
                      selectedSize === size
                        ? "border-black bg-black text-white"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <StockIndicator productId={product.id} selectedSize={selectedSize} selectedColor={selectedColor} />
              <SizeRecommender onSizeSelect={(size) => setSelectedSize(size)} />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-3">Quantidade</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 flex items-center justify-center border-2 rounded-lg hover:bg-gray-100"
                >
                  <Minus size={20} />
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-20 h-12 text-center text-lg font-semibold border-2 rounded-lg"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 flex items-center justify-center border-2 rounded-lg hover:bg-gray-100"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div ref={mainCTARef} className="flex gap-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-[#8C2F39] text-[#FAF6F2] py-4 rounded-lg font-semibold hover:bg-[#7a2832] transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                Adicionar ao Carrinho
              </button>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="w-14 h-14 flex items-center justify-center border-2 rounded-lg hover:bg-gray-50"
              >
                <Heart
                  size={24}
                  className={isFavorite ? "fill-red-500 text-red-500" : ""}
                />
              </button>
            </div>

            {/* Virtual Fitting Room */}
            <Link href={`/provador?produto=${product.id}`}>
              <button className="w-full mt-3 border-2 border-[#8C2F39] text-[#8C2F39] py-4 rounded-lg font-semibold hover:bg-[#8C2F39] hover:text-[#FAF6F2] transition-all flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Provador Virtual
              </button>
            </Link>

            {/* Benefits */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Truck className="text-green-600 mt-1" size={20} />
                <div>
                  <p className="font-medium">Frete Grátis</p>
                  <p className="text-sm text-gray-600">
                    Para compras acima de R$ 299,00
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RefreshCw className="text-blue-600 mt-1" size={20} />
                <div>
                  <p className="font-medium">Troca Grátis</p>
                  <p className="text-sm text-gray-600">
                    Primeira troca por nossa conta em até 30 dias
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="text-purple-600 mt-1" size={20} />
                <div>
                  <p className="font-medium">Compra Segura</p>
                  <p className="text-sm text-gray-600">
                    Ambiente seguro e protegido
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Complete o Look */}
        <CompleteOLook
          currentProductId={product.id}
          category={product.category}
          allProducts={productsData}
        />

        <PersonalizedRecommendations
          allProducts={productsData as any}
          currentProductId={product.id}
          title="Você também pode gostar"
        />

        {/* Product Description */}
        <div className="mt-16 max-w-4xl">
          <h2 className="text-2xl font-light mb-6">Descrição do Produto</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              O {product.name} é perfeito para quem busca conforto e estilo durante os treinos.
              Confeccionado com tecido de alta qualidade que proporciona excelente respirabilidade
              e secagem rápida.
            </p>
            <h3 className="text-lg font-medium mt-6 mb-3">Características:</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Tecido de alta performance com secagem rápida</li>
              <li>Proteção UV 50+</li>
              <li>Modelagem que valoriza o corpo</li>
              <li>Costuras planas para maior conforto</li>
              <li>Não marca o corpo</li>
              <li>Tecnologia anti-odor</li>
            </ul>
            <h3 className="text-lg font-medium mt-6 mb-3">Composição:</h3>
            <p className="text-gray-700">86% Poliamida, 14% Elastano</p>
          </div>
        </div>

        <ReviewSection productId={product.id} />
      </div>
    </div>
  );
}
