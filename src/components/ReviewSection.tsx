"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Star, Camera, X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  title: string | null;
  body: string;
  photos: string[];
  created_at: string;
};

function Stars({
  rating,
  interactive = false,
  onSelect,
}: {
  rating: number;
  interactive?: boolean;
  onSelect?: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type={interactive ? "button" : undefined}
          onClick={() => interactive && onSelect?.(i)}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            size={interactive ? 28 : 16}
            className={
              i <= (hovered || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-6 text-right text-gray-500">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-gray-400">{count}</span>
    </div>
  );
}

export function ReviewSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const supabase = createClient();

  // Form state
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("product_reviews")
        .select("id, customer_name, rating, title, body, photos, created_at")
        .eq("product_id", productId)
        .eq("approved", true)
        .order("created_at", { ascending: false });
      setReviews((data as Review[]) || []);
      setLoading(false);
    })();
  }, [productId]);

  const handlePhotos = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 3 - photos.length);
    setPhotos((prev) => [...prev, ...newFiles]);
    newFiles.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (i: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError("Selecione uma nota de 1 a 5 estrelas."); return; }
    if (!name.trim()) { setError("Informe seu nome."); return; }
    if (!body.trim()) { setError("Escreva sua avaliação."); return; }

    setError("");
    setSubmitting(true);

    try {
      // Upload photos to Supabase Storage
      const uploadedUrls: string[] = [];
      for (const file of photos) {
        const ext = file.name.split(".").pop();
        const path = `reviews/${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("product-reviews")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("product-reviews").getPublicUrl(path);
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      await supabase.from("product_reviews").insert({
        product_id: productId,
        customer_name: name.trim(),
        customer_email: email.trim() || null,
        rating,
        title: title.trim() || null,
        body: body.trim(),
        photos: uploadedUrls,
        approved: false,
      });

      setSubmitted(true);
      setShowForm(false);
    } catch (err) {
      setError("Erro ao enviar avaliação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const dist = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: reviews.filter((r) => r.rating === n).length,
  }));

  return (
    <div className="mt-16 max-w-4xl" id="avaliacoes">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light">Avaliações dos clientes</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-3 mt-1">
              <Stars rating={Math.round(avg)} />
              <span className="text-gray-500 text-sm">{avg.toFixed(1)} de 5 ({reviews.length} avaliações)</span>
            </div>
          )}
        </div>
        {!submitted && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-[#8C2F39] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#7a2832] transition-colors"
          >
            <Star size={15} />
            Avaliar produto
            {showForm ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        )}
      </div>

      {/* Rating distribution */}
      {reviews.length > 0 && (
        <div className="bg-[#FAF6F2] rounded-2xl p-5 mb-8 flex gap-8 items-center">
          <div className="text-center">
            <p className="text-5xl font-bold text-[#8C2F39]">{avg.toFixed(1)}</p>
            <Stars rating={Math.round(avg)} />
            <p className="text-xs text-gray-500 mt-1">{reviews.length} avaliações</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {dist.map(({ n, count }) => (
              <RatingBar key={n} label={String(n)} count={count} total={reviews.length} />
            ))}
          </div>
        </div>
      )}

      {/* Thank-you message */}
      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-green-800 text-sm">
          ✅ Avaliação enviada! Ela será exibida após aprovação.
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={submit} className="bg-white border rounded-2xl p-6 mb-8">
          <h3 className="font-semibold mb-5">Sua avaliação</h3>

          {/* Stars */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Nota *</label>
            <Stars rating={rating} interactive onSelect={setRating} />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-mail (opcional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="para confirmação"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Título (opcional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Amei o produto!"
              maxLength={80}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Avaliação *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Conte sua experiência com o produto..."
              rows={4}
              maxLength={500}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{body.length}/500</p>
          </div>

          {/* Photo upload */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">Fotos (até 3)</label>
            <div className="flex gap-3 flex-wrap">
              {previews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border">
                  <Image src={src} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {previews.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#8C2F39] hover:text-[#8C2F39] transition-colors"
                >
                  <Camera size={18} />
                  <span className="text-[10px]">Adicionar</span>
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handlePhotos(e.target.files)}
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-[#8C2F39] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#7a2832] transition-colors disabled:opacity-60"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              Enviar avaliação
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-xl border text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Star size={40} className="mx-auto mb-3 text-gray-200" />
          <p>Seja o primeiro a avaliar este produto!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((r) => (
            <div key={r.id} className="border-b pb-6 last:border-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Stars rating={r.rating} />
                    <span className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="font-semibold text-sm">{r.customer_name}</p>
                </div>
              </div>
              {r.title && <p className="font-medium mb-1">{r.title}</p>}
              <p className="text-gray-700 text-sm leading-relaxed">{r.body}</p>

              {/* Review photos */}
              {r.photos?.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {r.photos.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setLightbox(url)}
                      className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border hover:opacity-90 transition-opacity"
                    >
                      <Image src={url} alt={`Foto ${i + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white"
            onClick={() => setLightbox(null)}
          >
            <X size={28} />
          </button>
          <div className="relative max-w-lg w-full aspect-square">
            <Image src={lightbox} alt="Foto da avaliação" fill className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
