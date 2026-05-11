"use client";

import { useState, useEffect } from "react";
import { Star, ThumbsUp } from "lucide-react";

interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  size: string;
  color: string;
}

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: "",
    customerName: "",
    size: "",
    color: "",
  });

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = () => {
    const allReviews = JSON.parse(localStorage.getItem("reviews") || "[]");
    const productReviews = allReviews.filter((r: Review) => r.productId === productId);
    setReviews(productReviews);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const review: Review = {
      id: Date.now().toString(),
      productId,
      customerName: newReview.customerName,
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toISOString(),
      helpful: 0,
      size: newReview.size,
      color: newReview.color,
    };

    const allReviews = JSON.parse(localStorage.getItem("reviews") || "[]");
    allReviews.push(review);
    localStorage.setItem("reviews", JSON.stringify(allReviews));

    setReviews([review, ...reviews]);
    setShowForm(false);
    setNewReview({ rating: 5, comment: "", customerName: "", size: "", color: "" });
  };

  const markHelpful = (reviewId: string) => {
    const allReviews = JSON.parse(localStorage.getItem("reviews") || "[]");
    const updated = allReviews.map((r: Review) =>
      r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r
    );
    localStorage.setItem("reviews", JSON.stringify(updated));
    loadReviews();
  };

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const renderStars = (rating: number, size = 20) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold mb-6">Avaliações dos Clientes</h2>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">
              {averageRating.toFixed(1)}
            </div>
            {renderStars(Math.round(averageRating), 24)}
            <p className="text-sm text-gray-600 mt-2">
              {reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"}
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
          >
            {showForm ? "Cancelar" : "Escrever Avaliação"}
          </button>
        </div>
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 mb-8">
          <h3 className="font-bold mb-4">Sua Avaliação</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Nota</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReview({ ...newReview, rating: star })}
                >
                  <Star
                    size={32}
                    className={`${
                      star <= newReview.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    } cursor-pointer hover:scale-110 transition-transform`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Nome</label>
            <input
              type="text"
              value={newReview.customerName}
              onChange={(e) =>
                setNewReview({ ...newReview, customerName: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tamanho Comprado</label>
              <input
                type="text"
                value={newReview.size}
                onChange={(e) =>
                  setNewReview({ ...newReview, size: e.target.value })
                }
                placeholder="M"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cor Comprada</label>
              <input
                type="text"
                value={newReview.color}
                onChange={(e) =>
                  setNewReview({ ...newReview, color: e.target.value })
                }
                placeholder="Rosa"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Comentário</label>
            <textarea
              value={newReview.comment}
              onChange={(e) =>
                setNewReview({ ...newReview, comment: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
          >
            Enviar Avaliação
          </button>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Seja o primeiro a avaliar este produto!
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  {renderStars(review.rating)}
                  <p className="font-semibold mt-2">{review.customerName}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(review.date).toLocaleDateString("pt-BR")}
                    {review.size && review.color && (
                      <span className="ml-2">
                        • Tamanho {review.size} • {review.color}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <p className="text-gray-700 mb-3">{review.comment}</p>
              <button
                onClick={() => markHelpful(review.id)}
                className="text-sm text-gray-600 hover:text-black flex items-center gap-1"
              >
                <ThumbsUp size={16} />
                Útil ({review.helpful})
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
