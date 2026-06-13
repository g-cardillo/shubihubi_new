/**
 * Skeleton di una `ProductCard` per gli stati di caricamento (loading.tsx):
 * stesse proporzioni e radius della card reale (immagine 4/5 radius 18,
 * titolo, prezzo) con shimmer animato — vedi `.skeleton-shimmer` in globals.
 */
export function ProductCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="skeleton-shimmer aspect-[4/5] rounded-prod" />
      <div className="skeleton-shimmer mt-2.5 h-4 w-3/4 rounded-md" />
      <div className="skeleton-shimmer mt-1.5 h-4 w-1/3 rounded-md" />
    </div>
  );
}

/** Griglia di skeleton con lo stesso layout della griglia shop. */
export function ProductGridSkeleton({
  count = 10,
  columns = 'desk:grid-cols-5',
}: {
  count?: number;
  columns?: string;
}) {
  return (
    <ul className={`grid grid-cols-2 gap-x-4 gap-y-8 ${columns} desk:gap-x-[18px]`}>
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
