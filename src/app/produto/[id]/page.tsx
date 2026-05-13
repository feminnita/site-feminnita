"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import productsData from "@/data/products.json";
import { notFound } from "next/navigation";
import { useParams } from "next/navigation";

export default function ProdutoPage() {
  const params = useParams();
  const id = params?.id as string;

  const product = productsData.find((p) => p.slug === id || p.id === id);
  if (!product) notFound();

  const related = productsData
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return <ProdutoContent product={product} related={related} />;
}

function ProdutoContent({ product, related }: { product: (typeof productsData)[0]; related: (typeof productsData) }) {
  const [mainImg, setMainImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const isOutlet = product.fullPrice > product.price;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Breadcrumb */}
      <div className="max-w-[1200px] mx-auto px-4 py-3">
        <nav className="flex items-center gap-2 text-[12px] text-gray-400">
          <Link href="/" className="hover:text-gray-600">Início</Link>
          <span>/</span>
          <Link href={`/colecao/${product.category}`} className="hover:text-gray-600 capitalize">
            {product.category.replace("-", " ")}
          </Link>
          <span>/</span>
          <span className="text-gray-600">{product.name}</span>
        </nav>
      </div>

      {/* Product area */}
      <div className="max-w-[1200px] mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Images */}
          <div className="flex gap-3">
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex flex-col gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setMainImg(i)}
                    className="relative w-16 h-20 overflow-hidden border-2 transition-colors flex-shrink-0"
                    style={{ borderColor: mainImg === i ? "#8C2F39" : "#e0e0e0", borderRadius: 4 }}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div
              className="relative flex-1 overflow-hidden"
              style={{ paddingTop: "120%", background: "#f0f0f0", borderRadius: 8 }}
            >
              <Image
                src={product.images[mainImg]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">{product.code}</p>
              <h1 className="text-2xl font-light text-gray-800 leading-snug" style={{ fontFamily: "serif" }}>
                {product.name}
              </h1>
            </div>

            {/* Price */}
            <div>
              {isOutlet && (
                <p className="text-[13px] text-gray-400 line-through mb-1">{fmt(product.fullPrice)}</p>
              )}
              <p className="text-3xl font-bold" style={{ color: "#8C2F39" }}>
                {fmt(product.pixPrice)}
              </p>
              <p className="text-[13px] text-gray-500 mt-1">via PIX ou Boleto</p>
              <p className="text-[13px] text-gray-500 mt-0.5">
                ou em até{" "}
                <strong>{product.installments}x de {fmt(product.installmentPrice)}</strong> sem juros
              </p>
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <p className="text-[12px] uppercase tracking-wider text-gray-500 mb-2">Cor</p>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <div
                      key={color.name}
                      title={color.name}
                      className="w-6 h-6 rounded-full border-2 border-gray-200"
                      style={{ background: color.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] uppercase tracking-wider text-gray-500">Tamanho</p>
                <button className="text-[11px] text-gray-400 underline hover:text-gray-600">
                  Tabela de medidas
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className="w-12 h-12 border text-[13px] transition-all"
                    style={{
                      borderColor: selectedSize === size ? "#8C2F39" : "#e0e0e0",
                      color: selectedSize === size ? "#8C2F39" : "#555",
                      fontWeight: selectedSize === size ? 700 : 400,
                      background: selectedSize === size ? "#fff8f8" : "#fff",
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty + CTA */}
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                >
                  −
                </button>
                <span className="w-10 text-center text-[14px]">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                >
                  +
                </button>
              </div>

              {product.inStock ? (
                <button
                  className="flex-1 h-12 text-white text-[12px] uppercase tracking-[0.2em] font-semibold transition-opacity hover:opacity-90"
                  style={{ background: "#8C2F39" }}
                  onClick={() => {
                    if (!selectedSize) {
                      alert("Por favor, selecione um tamanho.");
                      return;
                    }
                  }}
                >
                  Adicionar ao Carrinho
                </button>
              ) : (
                <button
                  className="flex-1 h-12 border text-[12px] uppercase tracking-[0.2em] text-gray-500"
                  style={{ borderColor: "#e0e0e0" }}
                >
                  Avise-me quando chegar
                </button>
              )}
            </div>

            {/* Benefits */}
            <div className="border-t border-gray-100 pt-4 grid grid-cols-3 gap-3 text-center">
              {[
                { icon: "🚚", title: "Frete Grátis", sub: "acima de R$299" },
                { icon: "🔄", title: "Troca Fácil", sub: "em 30 dias" },
                { icon: "🔒", title: "Compra Segura", sub: "pagamento protegido" },
              ].map((b) => (
                <div key={b.title}>
                  <div className="text-2xl mb-1">{b.icon}</div>
                  <p className="text-[11px] font-semibold text-gray-700">{b.title}</p>
                  <p className="text-[10px] text-gray-400">{b.sub}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-[13px] font-semibold text-gray-700 mb-2 uppercase tracking-wider">Descrição</p>
              <p className="text-[13px] text-gray-500 leading-relaxed">{product.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-gray-100 py-12" style={{ background: "#fafafa" }}>
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-center text-[13px] font-light tracking-[0.3em] uppercase text-gray-600 mb-10">
              Você também pode gostar
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
