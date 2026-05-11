"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { MapPin, X } from "lucide-react";

export type HotspotEntry = {
  product_id: string;
  product_name: string;
  hotspot_x: number | null;
  hotspot_y: number | null;
};

type Props = {
  coverImage: string;
  hotspots: HotspotEntry[];
  onChange: (updated: HotspotEntry[]) => void;
};

const COLORS = ["#8C2F39", "#2563EB", "#16A34A", "#D97706", "#7C3AED"];

export function HotspotEditor({ coverImage, hotspots, onChange }: Props) {
  const [placing, setPlacing] = useState<string | null>(null); // product_id being placed
  const imgRef = useRef<HTMLDivElement>(null);

  const handleImageClick = (e: React.MouseEvent) => {
    if (!placing || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onChange(
      hotspots.map((h) =>
        h.product_id === placing
          ? { ...h, hotspot_x: Math.round(x * 10) / 10, hotspot_y: Math.round(y * 10) / 10 }
          : h
      )
    );
    setPlacing(null);
  };

  const clearHotspot = (productId: string) => {
    onChange(hotspots.map((h) => h.product_id === productId ? { ...h, hotspot_x: null, hotspot_y: null } : h));
  };

  if (!coverImage || hotspots.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={16} className="text-[#8C2F39]" />
        <p className="text-sm font-medium">Posicionar hotspots na foto</p>
      </div>

      {/* Product buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {hotspots.map((h, i) => (
          <div key={h.product_id} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPlacing(placing === h.product_id ? null : h.product_id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                placing === h.product_id
                  ? "text-white border-transparent shadow-inner"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              style={placing === h.product_id ? { backgroundColor: COLORS[i % COLORS.length] } : {}}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              {h.product_name.slice(0, 24)}
              {h.hotspot_x != null ? " ✓" : " (sem pin)"}
            </button>
            {h.hotspot_x != null && (
              <button
                type="button"
                onClick={() => clearHotspot(h.product_id)}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {placing && (
        <p className="text-xs text-[#8C2F39] font-medium mb-2 animate-pulse">
          👆 Clique na foto para posicionar o pin de "{hotspots.find((h) => h.product_id === placing)?.product_name}"
        </p>
      )}

      {/* Image with pins */}
      <div
        ref={imgRef}
        onClick={handleImageClick}
        className={`relative aspect-[2/3] rounded-xl overflow-hidden max-w-xs ${
          placing ? "cursor-crosshair ring-2 ring-[#8C2F39]" : "cursor-default"
        }`}
      >
        <Image src={coverImage} alt="Cover" fill sizes="320px" className="object-cover" />

        {hotspots.map((h, i) =>
          h.hotspot_x != null && h.hotspot_y != null ? (
            <div
              key={h.product_id}
              className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold"
              style={{
                left: `${h.hotspot_x}%`,
                top: `${h.hotspot_y}%`,
                transform: "translate(-50%, -50%)",
                backgroundColor: COLORS[i % COLORS.length],
              }}
            >
              {i + 1}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
