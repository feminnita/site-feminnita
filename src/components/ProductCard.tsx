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

  const isOutlet = product.fullPrice > product.price;
  const hasSecondImg = product.images.length > 1;

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Link
      href={`/produto/${product.slug}`}
      className="block group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 8,
          boxShadow: hovered
            ? "0 6px 20px rgba(0,0,0,0.12)"
            : "0 2px 8px rgba(0,0,0,0.06)",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
          transition: "box-shadow 0.2s, transform 0.2s",
          background: "#fff",
        }}
      >
        {/* Image wrap — portrait 120% */}
        <div
          className="relative overflow-hidden"
          style={{ paddingTop: "120%", background: "#f0f0f0" }}
        >
          <Image
            src={hovered && hasSecondImg ? product.images[1] : product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
            style={{
              transform: hovered ? "scale(1.04)" : "scale(1)",
              transition: "transform 0.3s",
            }}
            sizes="(max-width: 768px) 50vw, 25vw"
            unoptimized
          />

          {/* Badge */}
          {isOutlet && (
            <span
              className="absolute top-2.5 left-2.5 text-white text-[11px] font-bold uppercase px-2 py-0.5"
              style={{ background: "#8C2F39", borderRadius: 3 }}
            >
              Outlet
            </span>
          )}
          {!product.inStock && (
            <span
              className="absolute top-2.5 left-2.5 text-white text-[11px] font-bold uppercase px-2 py-0.5"
              style={{ background: "#888", borderRadius: 3 }}
            >
              Esgotado
            </span>
          )}

          {/* Heart */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setFavorited((f) => !f);
            }}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center transition-opacity"
            style={{ opacity: hovered || favorited ? 1 : 0 }}
            aria-label="Favoritar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={favorited ? "#8C2F39" : "none"} stroke="#8C2F39" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          {/* Comprar overlay */}
          {product.inStock && (
            <div
              className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-3 text-white text-[12px] tracking-widest uppercase transition-all duration-200"
              style={{
                background: "#8C2F39",
                opacity: hovered ? 1 : 0,
                transform: hovered ? "translateY(0)" : "translateY(8px)",
              }}
            >
              Comprar
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p
            className="text-[13px] text-gray-700 font-normal leading-snug mb-1.5 overflow-hidden"
            style={{ height: 36 }}
          >
            {product.name}
          </p>

          {isOutlet && (
            <p className="text-[12px] text-gray-400 line-through">
              {fmt(product.fullPrice)}
            </p>
          )}

          <p className="text-[16px] font-bold" style={{ color: "#8C2F39" }}>
            {fmt(product.pixPrice)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            via PIX ou Boleto
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            em até {product.installments}x de {fmt(product.installmentPrice)}
          </p>
        </div>
      </div>
    </Link>
  );
}
