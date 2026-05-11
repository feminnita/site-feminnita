"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Tv, Users, Heart, MessageCircle, Share2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type LiveProduct = {
  id: string;
  name: string;
  price: number;
  pix_price: number;
  images: string[];
  discount_pct?: number;
  live_note?: string;
};

type LiveSession = {
  id: string;
  title: string;
  stream_url: string;
  stream_type: "youtube" | "instagram" | "custom";
  is_live: boolean;
  viewer_count: number;
  pinned_products: LiveProduct[];
  chat_enabled: boolean;
};

function addToCart(product: LiveProduct) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const idx = cart.findIndex((i: any) => i.id === product.id);
  if (idx > -1) cart[idx].quantity += 1;
  else cart.push({ ...product, pixPrice: product.pix_price, selectedSize: "", selectedColor: "", quantity: 1 });
  localStorage.setItem("cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
}

function getEmbedUrl(url: string, type: string): string {
  if (type === "youtube") {
    const id = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/)?.[1] || url;
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=0`;
  }
  if (type === "instagram") {
    return url; // Instagram embeds need their own player
  }
  return url;
}

export default function LivePage() {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("live_sessions")
        .select("*, live_products(position, note, products(id, name, price, pix_price, images))")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const products = (data.live_products || [])
          .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
          .map((lp: any) => ({ ...lp.products, live_note: lp.note }))
          .filter(Boolean);

        setSession({ ...data, pinned_products: products });
        setLikeCount(data.like_count || 0);
      }
      setLoading(false);
    };

    load();

    // Realtime viewer count updates
    const channel = supabase
      .channel("live_sessions")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "live_sessions" },
        (payload) => {
          setSession((prev) => prev ? { ...prev, viewer_count: payload.new.viewer_count, is_live: payload.new.active } : prev);
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAdd = (product: LiveProduct) => {
    addToCart(product);
    setAdded(product.id);
    setTimeout(() => setAdded(null), 1800);
  };

  const handleLike = async () => {
    setLiked(true);
    setLikeCount((n) => n + 1);
    if (session) {
      await supabase.from("live_sessions").update({ like_count: likeCount + 1 }).eq("id", session.id);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: session?.title || "Live Feminnita", url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <Tv size={48} className="mx-auto mb-4 opacity-40" />
          <p className="text-lg opacity-60">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center px-4">
            <Tv size={64} className="text-gray-200 mx-auto mb-4" />
            <h1 className="text-2xl font-light mb-2">Nenhuma live agora</h1>
            <p className="text-gray-500 mb-6">Fique de olho nas nossas redes sociais para saber quando será a próxima!</p>
            <Link href="/produtos" className="bg-[#8C2F39] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#7a2832] transition-colors">
              Ver produtos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-white font-bold text-xl tracking-widest">FEMINNITA</Link>
          <div className="flex items-center gap-3">
            {session.is_live && (
              <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> AO VIVO
              </span>
            )}
            <span className="flex items-center gap-1 text-white/60 text-sm">
              <Users size={14} /> {(session.viewer_count || 0).toLocaleString("pt-BR")}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Video player */}
          <div className="lg:col-span-2">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
              {session.stream_url ? (
                <iframe
                  src={getEmbedUrl(session.stream_url, session.stream_type)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Tv size={64} className="text-white/20" />
                </div>
              )}
            </div>

            {/* Video controls */}
            <div className="flex items-center gap-4 mt-3 px-1">
              <h2 className="text-white font-medium flex-1 truncate">{session.title}</h2>
              <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-red-400" : "text-white/50 hover:text-white"}`}>
                <Heart size={18} className={liked ? "fill-red-400" : ""} />
                <span>{likeCount.toLocaleString("pt-BR")}</span>
              </button>
              <button onClick={handleShare} className="text-white/50 hover:text-white transition-colors">
                <Share2 size={18} />
              </button>
            </div>
          </div>

          {/* Products panel */}
          <div className="lg:col-span-1 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">Produtos em destaque</h3>
              <span className="text-white/40 text-xs">{session.pinned_products.length} peças</span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1">
              {session.pinned_products.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-8">Nenhum produto em destaque</p>
              ) : (
                session.pinned_products.map((product) => (
                  <div key={product.id} className="bg-white/10 backdrop-blur rounded-xl p-3 flex items-center gap-3 group">
                    <Link href={`/produto/${product.id}?ref=live`}>
                      <div className="relative w-16 h-20 rounded-lg overflow-hidden shrink-0 bg-white/5">
                        {product.images?.[0] && (
                          <Image src={product.images[0]} alt={product.name} fill sizes="64px" className="object-cover group-hover:scale-105 transition-transform" />
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium line-clamp-2">{product.name}</p>
                      {product.live_note && (
                        <p className="text-yellow-400 text-xs mt-0.5">{product.live_note}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {product.price > product.pix_price && (
                          <p className="text-white/40 text-xs line-through">R$ {product.price.toFixed(2).replace(".", ",")}</p>
                        )}
                        <p className="text-white font-bold text-sm">R$ {product.pix_price.toFixed(2).replace(".", ",")}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAdd(product)}
                      className={`shrink-0 p-2.5 rounded-xl transition-all ${
                        added === product.id ? "bg-green-500" : "bg-[#8C2F39] hover:bg-[#7a2832]"
                      }`}
                    >
                      {added === product.id ? <Check size={16} className="text-white" /> : <ShoppingCart size={16} className="text-white" />}
                    </button>
                  </div>
                ))
              )}
            </div>

            <Link href="/carrinho"
              className="block text-center bg-[#8C2F39] text-white py-3 rounded-xl font-medium hover:bg-[#7a2832] transition-colors text-sm">
              Ver carrinho & finalizar compra
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
