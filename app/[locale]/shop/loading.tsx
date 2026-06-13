import { ProductGridSkeleton } from '@/components/product/ProductCardSkeleton';

/**
 * Loading UI della rotta /shop: replica il layout della pagina (barra
 * categorie + riga filtri + griglia) con skeleton shimmer, così il passaggio
 * alla pagina reale non sposta il contenuto.
 */
export default function ShopLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Barra categorie */}
      <div className="mb-4 border-b border-black/10 pb-3">
        <div className="flex gap-7 px-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="skeleton-shimmer h-5 w-20 rounded-md" />
          ))}
        </div>
      </div>

      {/* Bottone filtri + contatore */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="skeleton-shimmer h-9 w-24 rounded-full" />
        <div className="skeleton-shimmer h-4 w-28 rounded-md" />
      </div>

      <ProductGridSkeleton count={10} />
    </div>
  );
}
