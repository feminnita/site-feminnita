"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Heart, Truck, RefreshCw, Shield, Share2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import productsData from "@/data/products.json";

const colorHex: Record<string, string> = {
  rose: "#D4A5A5", mint: "#A8D5BA", aloe: "#C8E6C9", hazel: "#B8A68F",
  cream: "#F5E6D3", mescla: "#9E9E9E", branco: "#FFFFFF", preto: "#1a1a1a",
  rosa: "#F48FB1", lilás: "#CE93D8", nude: "#E8C8B0", cinza: "#BDBDBD",
};

const fmt = (v: number) => v.toFixed(2).replace(".", ",");

export default function ProductPage() {
  const params = useParams();
  const [mainImg, setMainImg] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [fav, setFav] = useState(false);
  const [added, setAdded] = useState(false);

  const product = productsData.find((p) => p.id === params.id);
  const related = productsData.filter((p) => p.id !== params.id && p.category === product?.category).slice(0, 4);

  useEffect(() => {
    if (product) setSelectedColor(product.colors[0] || "");
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-[1400px] mx-auto px-6 py-24 text-center">
          <p className="text-gray-400 text-[13px]">Produto não encontrado.</p>
          <Link href="/" className="mt-6 inline-block text-[11px] tracking-widest uppercase border border-gray-800 px-8 py-3 hover:bg-gray-800 hover:text-white transition-colors">
            Voltar para home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      alert("Por favor, selecione um tamanho");
      return;
    }
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx = cart.findIndex((i: any) => i.id === product.id && i.selectedSize === selectedSize && i.selectedColor === selectedColor);
    if (idx > -1) cart[idx].quantity += quantity;
    else cart.push({ ...product, selectedSize, selectedColor, quantity });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=Confira este produto: ${encodeURIComponent(product.name)} - ${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[11px] text-gray-400 mb-8 uppercase tracking-wide">
          <Link href="/" className="hover:text-[#8C2F39]">Home</Link>
          <span>/</span>
          <Link href={`/categoria/${product.category}`} className="hover:text-[#8C2F39]">{product.category}</Link>
          <span>/</span>
          <span className="text-gray-600">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* Galeria — thumbnails à esquerda + imagem grande */}
          <div className="flex gap-3">
            {/* Thumbnails verticais */}
            <div className="flex flex-col gap-2 w-[72px] shrink-0">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setMainImg(i)}
                  className={`relative overflow-hidden bg-[#f5f0eb] border transition-colors ${mainImg === i ? "border-gray-800" : "border-transparent hover:border-gray-300"}`}
                  style={{ aspectRatio: "2/3" }}
                >
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>

            {/* Imagem principal */}
            <div className="flex-1 relative overflow-hidden bg-[#f5f0eb] cursor-zoom-in" style={{ aspectRatio: "2/3" }}>
              <Image
                src={product.images[mainImg] || "/placeholder.jpg"}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              <p className="absolute bottom-2 right-2 text-[10px] text-gray-400 bg-white/70 px-2 py-0.5">
                Clique para ampliar
              </p>
            </div>
          </div>

          {/* Info do produto */}
          <div className="flex flex-col gap-5">
            {/* Código e nome */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">{product.code}</p>
              <h1 className="text-[22px] font-light text-gray-900 mt-1 leading-snug">{product.name}</h1>

              {/* Share */}
              <div className="flex items-center gap-3 mt-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener"
                  className="text-[10px] text-gray-400 flex items-center gap-1 hover:text-green-600 transition-colors"
                >
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Compartilhar
                </a>
                <button className="text-[10px] text-gray-400 flex items-center gap-1 hover:text-gray-700">
                  <Share2 size={12} /> Copiar link
                </button>
              </div>
            </div>

            {/* Preço */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-[22px] font-medium text-gray-900">R$ {fmt(product.pixPrice)}</p>
              <p className="text-[12px] text-gray-500">via PIX ou Boleto</p>
              <p className="text-[12px] text-gray-400 mt-0.5">(em até {product.installments}x de R$ {fmt(product.installmentPrice)})</p>
            </div>

            {/* Cor */}
            {product.colors.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">
                  Cor: <span className="text-gray-800 font-medium">{selectedColor}</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      title={c}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === c ? "border-gray-800 scale-110" : "border-transparent hover:border-gray-300"}`}
                      style={{ backgroundColor: colorHex[c.toLowerCase()] || "#ccc", outline: selectedColor === c ? "2px solid #fff" : "none", outlineOffset: "-3px" }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tamanho */}
            {product.sizes.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">Tamanho</p>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`w-12 h-10 border text-[12px] font-medium transition-colors ${selectedSize === s ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:border-gray-500"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantidade */}
            <div>
              <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">Quantidade</p>
              <div className="flex items-center border border-gray-200 w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg"
                >−</button>
                <span className="w-10 text-center text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg"
                >+</button>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                className={`flex-1 py-4 text-[12px] font-semibold tracking-widest uppercase transition-colors ${added ? "bg-green-700 text-white" : "bg-gray-900 text-white hover:bg-[#8C2F39]"}`}
              >
                {added ? "Adicionado ✓" : "Comprar"}
              </button>
              <button
                onClick={() => setFav(!fav)}
                className="w-14 h-14 flex items-center justify-center border border-gray-200 hover:border-gray-400 transition-colors"
                aria-label="Favoritar"
              >
                <Heart size={20} strokeWidth={1.5} className={fav ? "fill-[#8C2F39] text-[#8C2F39]" : "text-gray-600"} />
              </button>
            </div>

            {/* Benefícios */}
            <div className="border-t border-gray-100 pt-5 space-y-3">
              {[
                { icon: <Truck size={15} strokeWidth={1.5} />, text: "Frete grátis acima de R$ 299" },
                { icon: <RefreshCw size={15} strokeWidth={1.5} />, text: "Primeira troca por nossa conta em 30 dias" },
                { icon: <Shield size={15} strokeWidth={1.5} />, text: "Compra 100% segura" },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-[12px] text-gray-500">
                  <span className="text-gray-400">{b.icon}</span>
                  {b.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Descrição */}
        <div className="mt-16 border-t border-gray-100 pt-12 max-w-2xl">
          <h2 className="text-[13px] uppercase tracking-widest text-gray-700 mb-6">Descrição</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {product.name} — peça exclusiva da coleção Feminnita. Confeccionada com tecido de alta qualidade,
            trazendo conforto e elegância para o seu dia a dia.
          </p>
        </div>

        {/* Produtos relacionados */}
        {related.length > 0 && (
          <div className="mt-16 border-t border-gray-100 pt-12">
            <h2 className="text-center text-[13px] uppercase tracking-widest text-gray-700 mb-8">
              Você também pode gostar
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
