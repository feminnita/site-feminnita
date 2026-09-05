"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useCart } from "../cart/useCart";
import { toast } from "sonner"
import { useColorSwatches } from "../../hooks/color/useColorSwatches";
import {
    fetchProduct,
    fetchProductStock,
    trackProductView,
} from "@/src/services/productsService";
import {
    trackAddToCartAnalytics,
    trackViewItemAnalytics,
} from "@/src/utils/analytics";
import { buildCartItem, getDisplayImages } from "@/src/utils/product";
import type { SkuStock, StoreProduct } from "@/src/types/product/products";

export function useProductPage() {
    const params = useParams();
    const cart = useCart();
    const swatches = useColorSwatches();

    const [product, setProduct] = useState<StoreProduct | null>(null);
    const [loadingProduct, setLoadingProduct] = useState(false);
    const [skus, setSkus] = useState<SkuStock[]>([]);
    const [selectedImage, setSelectedImage] = useState(0);
    const [showVideo, setShowVideo] = useState(false);
    const [selectedColor, setSelectedColor] = useState("");
    const [selectedSize, setSelectedSize] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [stickyVisible, setStickyVisible] = useState(false);
    const mainCTARef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const idOrSlug = Array.isArray(params.id) ? params.id[0] : params.id;
        if (!idOrSlug) return;
        setLoadingProduct(true);
        fetchProduct(idOrSlug).then((p) => {
            setProduct(p);
            setLoadingProduct(false);
        });
    }, [params.id]);

    useEffect(() => {
        if (!product) return;
        fetchProductStock(product.id)
            .then(setSkus)
            .catch(() => setSkus([]));
    }, [product]);

    useEffect(() => {
        if (!mainCTARef.current) return;
        const obs = new IntersectionObserver(
            ([entry]) => setStickyVisible(!entry.isIntersecting),
            { threshold: 0 },
        );
        obs.observe(mainCTARef.current);
        return () => obs.disconnect();
    }, [product]);

    useEffect(() => {
        if (!product) return;
        setSelectedColor(product.colors[0] || "");
        trackProductView(product.id);
        trackViewItemAnalytics(product);
    }, [product]);

    const selectColor = (color: string) => {
        setSelectedColor(color);
        setSelectedImage(0);
    };

    const selectImage = (index: number) => {
        setShowVideo(false);
        setSelectedImage(index);
    };

    const availableFor = (size: string, color: string): number | null => {
        if (skus.length === 0) return null;

        const sku = skus.find((s) => {
            const sizeMatch = s.size === size;
            const colorMatch =
                !color || !s.color || s.color.toLowerCase() === color.toLowerCase();
            return sizeMatch && colorMatch;
        });

        return sku ? sku.availableQty : 0;
    };

    const handleAddToCart = () => {
        if (!product) return;
        if (!selectedSize) {
            toast.warning("Selecione um tamanho");
            return;
        }

        const available = availableFor(selectedSize, selectedColor);
        if (available !== null && available === 0) {
            toast.error("Este tamanho está esgotado");
            return;
        }
        if (available !== null && quantity > available) {
            toast.error(`Só ${available} unidade${available > 1 ? "s" : ""} disponível${available > 1 ? "eis" : ""}`);
            return;
        }

        cart.add(buildCartItem({ product, selectedSize, selectedColor, quantity }));
        trackAddToCartAnalytics(product, quantity);
        toast.success(`${quantity}x adicionado ao carrinho!`);
    };

    const displayImages = product ? getDisplayImages(product, selectedColor) : [];

    // Esgotado (link direto/Google): sem estoque total OU, com os SKUs já carregados,
    // nenhum com disponibilidade. A página segue visível (fotos/descrição), mas o CTA
    // de comprar é trocado por um aviso — nunca um botão de compra quebrado.
    const soldOut =
        !!product &&
        (product.stock <= 0 ||
            (skus.length > 0 && skus.every((s) => s.availableQty <= 0)));

    return {
        product,
        loadingProduct,
        soldOut,
        skus,
        swatches,
        selectedImage,
        showVideo,
        setShowVideo,
        selectImage,
        selectedColor,
        selectColor,
        selectedSize,
        setSelectedSize,
        quantity,
        setQuantity,
        isFavorite,
        setIsFavorite,
        stickyVisible,
        mainCTARef,
        displayImages,
        handleAddToCart,
    };
}
