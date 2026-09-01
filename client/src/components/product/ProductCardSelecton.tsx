export function ProductCardSelecton() {
    return (
        <div className="animate-pulse">
            <div className="mb-3 aspect-square rounded bg-gray-200" />
            <div className="space-y-2">
                <div className="h-3 w-1/3 rounded bg-gray-200" />
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-200" />
                <div className="flex gap-2 pt-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-8 w-8 rounded-full bg-gray-200" />
                    ))}
                </div>
                <div className="mt-3 h-10 rounded-lg bg-gray-200" />
            </div>
        </div>
    );
}

export function ProductGridSelecton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSelecton key={i} />
            ))}
        </div>
    );
}
