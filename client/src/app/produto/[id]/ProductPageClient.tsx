"use client";

import Link from "next/link";
import { Header } from "../../../components/layout/Header";
import {
    JsonLd,
    breadcrumbSchema,
    productSchema,
} from "../../../components/common/JsonLd";
import { ProductReviews } from "../../../components/product/ProductReviews";
import { RelatedSections } from "../../../components/product/RelatedSections";
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
import type { StoreProduct } from "../../../types/product/products";
import { toEmbedUrl } from "../../../utils/product";
import { effectivePrice } from "../../../utils/pricing";

export default function ProductPageClient({
    id,
    initialProduct = null,
}: {
    id: string;
    initialProduct?: StoreProduct | null;
}) {
    const {
        product,
        loadingProduct,
        soldOut,
        availableColors,
        visibleSizes,
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
    } = useProductPage(id, initialProduct);

    if (loadingProduct) {
        return (
            <div className="min-h-screen">
                <Header />
                <div className="flex items-center justify-center py-32">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#000000] border-t-transparent" />
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
            {/* Os dados estruturados saem daqui: agora sao montados em page.tsx,
                no servidor, para chegarem no HTML que o Google le. Aqui eles so
                existiam depois da pagina carregar no navegador. */}
            <Header />

            {!soldOut && (
                <StickyMobileCta
                    visible={stickyVisible}
                    productName={product.name}
                    // Preco COM a promocao, o mesmo do bloco de preco. Antes ia o
                    // preco cheio: a barra fixa do celular mostrava R$ 79,99 numa
                    // blusa anunciada a R$ 19,99.
                    price={effectivePrice(
                        product.price,
                        product.salePrice,
                        product.saleStart,
                        product.saleEnd,
                    )}
                    onAddToCart={handleAddToCart}
                    disabled={!selectedSize}
                />
            )}

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
                            saleStart={product.saleStart}
                            saleEnd={product.saleEnd}
                            promo={product.promo}
                            installments={product.installments}
                            installmentPrice={product.installmentPrice}
                        />

                        {soldOut ? (
                            <div
                                ref={mainCTARef}
                                className="rounded-lg border border-[#000000]/20 bg-[#EEEEEE] px-4 py-6 text-center"
                            >
                                <p className="text-lg font-semibold uppercase tracking-wide text-[#000000]">
                                    Esgotado
                                </p>
                                <p className="mt-1 text-sm text-gray-600">
                                    Produto esgotado no momento.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Cor ANTES do tamanho (18/11). Embaixo do botão de
                                    comprar a cliente escolhia o tamanho, apertava
                                    Adicionar e levava a 1ª cor (Branco) sem ver as
                                    outras: o anúncio era da regata azul. A grade já
                                    mostra só 8 e abre o resto em "Ver todas as cores". */}
                                <ColorSelector
                                    colors={availableColors}
                                    selectedColor={selectedColor}
                                    onSelect={selectColor}
                                    colorImages={product.colorImages}
                                />

                                <div id="seletor-tamanho">
                                    <div className="mb-2 flex items-center justify-end">
                                        <SizeChartTrigger
                                            chart={product.sizeChart}
                                            selectedSize={selectedSize}
                                        />
                                    </div>
                                    <SizeSelector
                                        productId={product.id}
                                        sizes={visibleSizes}
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
                            </>
                        )}

                        <ProductBenefits />

                        {/* Descrição e avaliações ficam NA COLUNA DA DIREITA, embaixo
                            dos benefícios (referência: useange.com.br). Antes ocupavam
                            a largura inteira da página abaixo da grade. */}
                        <ProductDescription
                            productName={product.name}
                            description={product.description}
                        />

                        <ProductReviews reviews={product.reviews} />
                    </div>
                </div>

                <RelatedSections
                    productId={product.id}
                    categoryId={product.category_id}
                />
            </div>
        </div>
    );
}
