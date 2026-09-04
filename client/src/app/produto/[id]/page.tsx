"use client";

import Link from "next/link";
import { Header } from "../../../components/layout/Header";
import {
    JsonLd,
    breadcrumbSchema,
    productSchema,
} from "../../../components/common/JsonLd";
import { SimilarProducts } from "../../../components/product/SimilarProducts";
import { ColorSelector } from "../../../components/product/ColorSelector";
import { PriceBlock } from "../../../components/product/PriceBlock";
import { ProductActions } from "../../../components/product/ProductActions";
import { ProductBenefits } from "../../../components/product/ProductBenefits";
import { ProductDescription } from "../../../components/product/ProductDescription";
import { ProductGallery } from "../../../components/product/ProductGallery";
import { QuantitySelector } from "../../../components/product/QuantitySelector";
import { SizeSelector } from "../../../components/product/SizeSelector";
import { SizeChartTrigger } from "../../../components/product/SizeChartTrigger";
import { StickyMobileCta } from "../../../components/product/StickMobileCta";
import { useProductPage } from "../../../hooks/product/useProductPage";
import { toEmbedUrl } from "../../../utils/product";

export default function ProductPage() {
    const {
        product,
        loadingProduct,
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
        skus,
    } = useProductPage();

    if (loadingProduct) {
        return (
            <div className="min-h-screen">
                <Header />
                <div className="flex items-center justify-center py-32">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8C2F39] border-t-transparent" />
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen">
                <Header />
                <div className="container mx-auto px-4 py-16 text-center">
                    <h1 className="mb-4 text-2xl">Produto não encontrado</h1>
                    <Link href="/" className="text-blue-600 underline">
                        Voltar para home
                    </Link>
                </div>
            </div>
        );
    }

    // Categoria "Aguardando classificação" (bucket sem classificação) não deve
    // aparecer para o cliente — some do breadcrumb (visível e JSON-LD).
    const showCategoryCrumb =
        !!product.category &&
        product.category !== "Aguardando classificação" &&
        product.category !== "bling-aguardando-classificacao";

    return (
        <div className="min-h-screen bg-white pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
            <JsonLd data={productSchema(product)} />
            <JsonLd
                data={breadcrumbSchema([
                    { name: "Home", url: "https://feminnita.com.br/" },
                    ...(showCategoryCrumb
                        ? [
                              {
                                  name: product.category,
                                  url: `https://feminnita.com.br/categoria/${product.category}`,
                              },
                          ]
                        : []),
                    {
                        name: product.name,
                        url: `https://feminnita.com.br/produto/${product.id}`,
                    },
                ])}
            />
            <Header />

            <StickyMobileCta
                visible={stickyVisible}
                productName={product.name}
                price={product.price}
                onAddToCart={handleAddToCart}
                disabled={!selectedSize}
            />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-6 text-sm text-gray-500">
                    <Link href="/" className="hover:underline">
                        Home
                    </Link>
                    {showCategoryCrumb && (
                        <>
                            {" / "}
                            <Link
                                href={`/categoria/${product.category}`}
                                className="hover:underline"
                            >
                                {product.category}
                            </Link>
                        </>
                    )}
                    {" / "}
                    <span>{product.name}</span>
                </div>

                <div className="grid gap-12 md:grid-cols-2">
                    <ProductGallery
                        productName={product.name}
                        images={displayImages}
                        videoUrl={product.videoUrl}
                        selectedImage={selectedImage}
                        onSelectImage={selectImage}
                        showVideo={showVideo}
                        onShowVideo={() => setShowVideo(true)}
                        embedUrl={product.videoUrl ? toEmbedUrl(product.videoUrl) : ""}
                    />

                    <div className="space-y-6">
                        <div>
                            <p className="text-sm uppercase text-gray-500">{product.code}</p>
                            <h1 className="mt-2 text-3xl font-light">{product.name}</h1>
                        </div>

                        <PriceBlock
                            price={product.price}
                            salePrice={product.salePrice}
                            installments={product.installments}
                            installmentPrice={product.installmentPrice}
                        />

                        <ColorSelector
                            colors={product.colors}
                            selectedColor={selectedColor}
                            onSelect={selectColor}
                            swatches={swatches}
                        />

                        <div>
                            <div className="mb-2 flex items-center justify-end">
                                <SizeChartTrigger chart={product.sizeChart} />
                            </div>
                            <SizeSelector
                                productId={product.id}
                                sizes={product.sizes}
                                selectedSize={selectedSize}
                                selectedColor={selectedColor}
                                skus={skus}
                                onSelect={setSelectedSize}
                            />
                        </div>

                        <QuantitySelector quantity={quantity} onChange={setQuantity} />

                        <ProductActions
                            ctaRef={mainCTARef}
                            productId={product.id}
                            isFavorite={isFavorite}
                            onToggleFavorite={() => setIsFavorite(!isFavorite)}
                            onAddToCart={handleAddToCart}
                            disabled={!selectedSize}
                        />

                        <ProductBenefits />
                    </div>
                </div>

                <ProductDescription
                    productName={product.name}
                    description={product.description}
                />
            </div>

            <SimilarProducts productId={product.id} categoryId={product.category_id} />
        </div>
    );
}
