import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getAllSlugs } from '@/lib/products/repository';

const SITE_URL = 'https://shubihubi.com';

/**
 * Sitemap dinamica: home + shop + pagina di ogni prodotto, per ogni locale.
 * Ogni voce include gli `alternates` hreflang IT/EN per la SEO multilingua.
 * Sostituisce l'assenza di sitemap della SPA Flutter.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllSlugs();

  const languagesFor = (path: string) =>
    Object.fromEntries(
      routing.locales.map((l) => [l, `${SITE_URL}/${l}${path}`]),
    );

  const entry = (path: string): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}/${routing.defaultLocale}${path}`,
    lastModified: new Date(),
    alternates: { languages: languagesFor(path) },
  });

  // Pagine contenuto statiche (Fase 2).
  const staticPaths = [
    '',
    '/shop',
    '/gallery',
    '/about',
    '/live-painting',
    '/stationery',
    '/events',
    '/contacts',
    '/support',
    '/cookie-policy',
    '/shipping-policy',
    '/terms-of-service',
  ];

  return [
    ...staticPaths.map(entry),
    ...slugs.map((slug) => entry(`/shop/${slug}`)),
  ];
}
