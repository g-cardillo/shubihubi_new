import { NextResponse, type NextRequest } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * Invalidazione cache on-demand — utile in sviluppo per vedere subito le
 * modifiche fatte su Firestore senza rifare la build.
 *
 * Le pagine shop/prodotto leggono il catalogo da `getAllProducts()`, avvolto in
 * `unstable_cache(..., { tags: ['products'] })`. Ribustando il tag `products`
 * la prossima richiesta rilegge Firestore.
 *
 * Uso (dev):
 *   curl "http://localhost:3000/api/revalidate?tag=products"
 *   curl "http://localhost:3000/api/revalidate?path=/it/shop/capasanta"
 *
 * In produzione richiede il segreto REVALIDATE_SECRET:
 *   curl "https://.../api/revalidate?tag=products&secret=XYZ"
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tag = searchParams.get('tag');
  const path = searchParams.get('path');
  const secret = searchParams.get('secret');

  // In produzione serve il segreto; in sviluppo è libero.
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  }

  const revalidated: { tags: string[]; paths: string[] } = { tags: [], paths: [] };

  // Default: se non passi nulla, ribusta il catalogo prodotti.
  if (!tag && !path) {
    revalidateTag('products');
    revalidated.tags.push('products');
  }
  if (tag) {
    revalidateTag(tag);
    revalidated.tags.push(tag);
  }
  if (path) {
    revalidatePath(path);
    revalidated.paths.push(path);
  }

  return NextResponse.json({ ok: true, revalidated, now: Date.now() });
}
