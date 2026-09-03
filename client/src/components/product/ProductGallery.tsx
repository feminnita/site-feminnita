"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { ProductGalleryProps } from "../../types/product/products";
import { Play } from "lucide-react";

export function ProductGallery({
    productName,
    images,
    videoUrl,
    selectedImage,
    onSelectImage,
    showVideo,
    onShowVideo,
}: ProductGalleryProps) {
    const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
    const [zooming, setZooming] = useState(false);
    const [canHover, setCanHover] = useState(false);

    useEffect(() => {
        setCanHover(
            window.matchMedia("(hover: hover) and (pointer: fine)").matches,
        );
    }, []);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!canHover) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomOrigin(`${x}% ${y}%`);
    };

    return (
        <div className="flex min-w-0 flex-col-reverse gap-3 md:flex-row">
            {(images.length > 1 || videoUrl) && (
                <div className="flex gap-3 overflow-x-auto md:max-h-[600px] md:w-20 md:flex-col md:overflow-y-auto">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => onSelectImage(index)}
                            className={`relative aspect-[2/3] w-16 flex-shrink-0 overflow-hidden rounded-md border-2 bg-gray-100 md:w-full ${!showVideo && selectedImage === index
                                    ? "border-[#8C2F39]"
                                    : "border-transparent hover:border-gray-300"
                                }`}
                        >
                            <Image
                                src={image}
                                alt={`${productName} ${index + 1}`}
                                fill
                                sizes="80px"
                                className="object-cover"
                            />
                        </button>
                    ))}
                    {videoUrl && (
                        <button
                            onClick={onShowVideo}
                            className={`relative flex aspect-[2/3] w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border-2 bg-black md:w-full ${showVideo
                                    ? "border-[#8C2F39]"
                                    : "border-transparent hover:border-gray-300"
                                }`}
                            title="Vídeo do produto"
                        >
                            {images[0] && (
                                <Image
                                    src={images[0]}
                                    alt="vídeo"
                                    fill
                                    sizes="80px"
                                    className="object-cover opacity-40"
                                />
                            )}
                            <Play size={20} className="relative text-white" fill="white" />
                        </button>
                    )}
                </div>
            )}

            <div
                className="relative aspect-[4/5] w-full max-w-sm self-center overflow-hidden rounded-lg bg-gray-100 md:aspect-[2/3] md:max-w-none md:flex-1 md:self-auto"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => canHover && setZooming(true)}
                onMouseLeave={() => setZooming(false)}
            >
                {showVideo && videoUrl ? (
                    <video
                        src={videoUrl}
                        className="absolute inset-0 h-full w-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="none"
                    />
                ) : images[selectedImage] ? (
                    <Image
                        src={images[selectedImage]}
                        alt={productName}
                        fill
                        sizes="(max-width: 768px) 384px, 45vw"
                        className={`cursor-zoom-in object-cover transition-transform duration-200 ease-out ${zooming ? "scale-[2]" : "scale-100"
                            }`}
                        style={{ transformOrigin: zoomOrigin }}
                        priority
                        quality={90}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                        Sem imagem
                    </div>
                )}
            </div>
        </div>
    );
}
