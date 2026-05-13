"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  pixPrice: number;
  fullPrice: number;
  installments: number;
  installmentPrice: number;
  images: string[];
  category: string;
  inStock: boolean;
}

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const [hovered, setHovered] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const hasSecondImg = product.images.length > 1;
  const isOutlet = product.fullPrice > product.price;

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Link
      href={`/produto/${product.slug}`}
      className="block group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ paddingTop: "140%", background: "#f0f0f0" }}>
        <Image
          src={hovered && hasSecondImg ? product.images[1] : product.images[0]}
          alt={product.name}
          fill
          className="object-cover"
          style={{
            transform: hovered ? "scale(1.04)" : "scale(1)",
            transition: "transform 0.4s ease",
          }}
          sizes="(max-width: 768px) 50vw, 25vw"
          unoptimized
        />

        {/* Badge */}
        {isOutlet && (
          <span
            className="absolute top-2.5 left-2.5 text-white text-[10px] font-bold uppercase px-2 py-0.5"
            style={{ background: "#8C2F39" }}
          >
            Outlet
          </span>
        )}

        {/* Overlay COMPRAR + FAVORITAR */}
        <div
          className="absolute bottom-0 left-0 right-0 flex"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(8px)",
            transition: "all 0.2s ease",
          }}
        >
          {product.inStock ? (
            <div
              className="flex-1 flex items-center justify-center gap-2 py-3 text-white text-[11px] uppercase tracking-[0.2em] font-semibold"
              style={{ background: "#8C2F39" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              Comprar
            </div>
          ) : (
            <div
              className="flex-1 flex items-center justify-center py-2.5 text-white text-[11px] uppercase tracking-wider"
              style={{ background: "#888" }}
            >
              Esgotado
            </div>
          )}
          <button
            onClick={(e) => { e.preventDefault(); setFavorited(f => !f); }}
            className="flex items-center justify-center gap-1 py-3 px-3 text-white text-[11px] uppercase tracking-[0.1em] border-l border-white/20"
            style={{ background: "#8C2F39" }}
            aria-label="Favoritar"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={favorited ? "#fff" : "none"} stroke="#fff" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Favoritar
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="pt-3 pb-1">
        <p className="text-[11px] text-gray-400 mb-0.5">{product.id}</p>
        <p className="text-[14px] text-gray-700 leading-snug mb-1">{product.name}</p>
        <p className="text-[17px] font-bold" style={{ color: "#8C2F39" }}>
          {fmt(product.pixPrice)}
        </p>
        <p className="text-[12px] text-gray-400">via PIX ou Boleto</p>
        <p className="text-[12px] text-gray-400">
          (em até {product.installments}x de {fmt(product.installmentPrice)})
        </p>
      </div>
    </Link>
  );
}
