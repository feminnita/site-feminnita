"use client";

import { Instagram } from "lucide-react";
import Image from "next/image";

export function InstagramFeed() {
  // Mock Instagram posts - em produção, usar API do Instagram
  const instagramPosts = [
    { id: 1, image: "https://source.unsplash.com/400x400/?fitness,woman,1", likes: 234 },
    { id: 2, image: "https://source.unsplash.com/400x400/?yoga,woman,2", likes: 189 },
    { id: 3, image: "https://source.unsplash.com/400x400/?gym,woman,3", likes: 312 },
    { id: 4, image: "https://source.unsplash.com/400x400/?workout,woman,4", likes: 267 },
    { id: 5, image: "https://source.unsplash.com/400x400/?fitness,gym,5", likes: 445 },
    { id: 6, image: "https://source.unsplash.com/400x400/?sports,woman,6", likes: 198 },
  ];

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Instagram size={32} />
            <h2 className="text-3xl font-bold">@feminnita</h2>
          </div>
          <p className="text-gray-600">
            Siga-nos no Instagram e inspire-se com nossa comunidade!
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {instagramPosts.map((post) => (
            <a
              key={post.id}
              href="https://instagram.com/feminnita"
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square overflow-hidden group cursor-pointer"
            >
              <Image
                src={post.image}
                alt={`Instagram post ${post.id}`}
                fill
                className="object-cover transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 text-white flex items-center gap-2">
                  <Instagram size={20} />
                  <span>{post.likes}</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="text-center mt-8">
          <a
            href="https://instagram.com/feminnita"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600"
          >
            <Instagram size={20} />
            Seguir no Instagram
          </a>
        </div>
      </div>
    </div>
  );
}
