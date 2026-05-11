export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[2/3] bg-gray-200 rounded mb-3" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="flex gap-2 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-gray-200" />
          ))}
        </div>
        <div className="h-10 bg-gray-200 rounded-lg mt-3" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
