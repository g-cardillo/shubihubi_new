import { NextResponse, type NextRequest } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { adminAuth } from '@/lib/firebase/admin';

/**
 * Invalidazione cache on-demand.
 *
 * Le pagine shop/prodotto leggono il catalogo da `getAllProducts()`, avvolto in
 * `unstable_cache(..., { tags: ['products'] })`. Ribustando il tag `products`
 * la prossima richiesta rilegge Firestore. Si possono passare più `tag` e più
 * `path`; i path con segmenti dinamici (es. `/[locale]/shop/[slug]`) vengono
 * rivalidati come route intera (`type: 'page'`).
 *
 * Uso (dev, libero):
 *   curl "http://localhost:3000/api/revalidate?tag=products"
 *   curl "http://localhost:3000/api/revalidate?path=/it/shop/capasanta"
 *
 * In produzione serve UNA delle due autorizzazioni:
 *   - segreto:   ?secret=REVALIDATE_SECRET (per curl/script);
 *   - admin:     header `Authorization: Bearer <Firebase ID token>` con claim
 *     `admin === true` (usato dal pannello admin dopo il salvataggio prodotto,
 *     così il segreto non finisce nel bundle client).
 */
async function isAuthorized(req: NextRequest): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production') return true;

  const secret = req.nextUrl.searchParams.get('secret');
  if (process.env.REVALIDATE_SECRET && secret === process.env.REVALIDATE_SECRET) {
    return true;
  }

  const bearer = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (bearer) {
    try {
      const decoded = await adminAuth.verifyIdToken(bearer);
      return decoded.admin === true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const tags = searchParams.getAll('tag');
  const paths = searchParams.getAll('path');

  const revalidated: { tags: string[]; paths: string[] } = { tags: [], paths: [] };

  // Default: se non passi nulla, ribusta il catalogo prodotti.
  if (tags.length === 0 && paths.length === 0) {
    revalidateTag('products');
    revalidated.tags.push('products');
  }
  for (const tag of tags) {
    revalidateTag(tag);
    revalidated.tags.push(tag);
  }
  for (const path of paths) {
    // I path con segmenti dinamici vanno rivalidati come route intera.
    revalidatePath(path, path.includes('[') ? 'page' : undefined);
    revalidated.paths.push(path);
  }

  return NextResponse.json({ ok: true, revalidated, now: Date.now() });
}
