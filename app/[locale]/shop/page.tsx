import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { getAllProducts, getMacroCategories, PRODUCTS_REVALIDATE } from '@/lib/products/repository';
import { getUserFilterGroups } from '@/lib/products/filterGroups';
import { macroById } from '@/lib/admin/taxonomy';
import type { Product } from '@/lib/types/product';
import { ProductCard } from '@/components/product/ProductCard';
import { ShopBrowser, type ShopCard } from '@/components/shop/ShopBrowser';
import type { ShopMacro } from '@/components/shop/CategoryBar';

// ISR: la pagina shop si rigenera al massimo ogni 5 minuti.
export const revalidate = PRODUCTS_REVALIDATE;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'shop' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: `/${locale}/shop`,
      languages: { it: '/it/shop', en: '/en/shop' },
    },
  };
}

/**
 * Costruisce le voci della barra macro: per ogni `macroId` reale (già ordinato
 * per frequenza da `getMacroCategories`) le sottocategorie DISPONIBILI nei
 * prodotti, nell'ordine seed della tassonomia (poi extra per frequenza).
 * Le etichette sono localizzate via tassonomia quando esiste la versione ENG.
 */
function buildShopMacros(
  products: Product[],
  ordered: Array<{ value: string }>,
  locale: Locale,
): ShopMacro[] {
  const isEng = locale === 'en';
  return ordered
    .filter((m) => m.value)
    .map(({ value }) => {
      const taxo = macroById(value);

      // Sottocategorie distinte (case-insensitive) tra i prodotti della macro.
      const counts = new Map<string, { label: string; count: number }>();
      for (const p of products) {
        if (p.macroId !== value) continue;
        const raw = (p.subcategory ?? '').trim();
        if (!raw) continue;
        const key = raw.toLowerCase();
        const entry = counts.get(key);
        if (entry) entry.count += 1;
        else counts.set(key, { label: raw, count: 1 });
      }

      const seedOrder = taxo?.subcategories.map((s) => s.it.toLowerCase()) ?? [];
      const pos = (key: string) => {
        const i = seedOrder.indexOf(key);
        return i === -1 ? seedOrder.length : i;
      };
      const subs = Array.from(counts.entries())
        .sort(
          (a, b) =>
            pos(a[0]) - pos(b[0]) ||
            b[1].count - a[1].count ||
            a[1].label.localeCompare(b[1].label),
        )
        .map(([key, { label }]) => {
          const eng = taxo?.subcategories.find(
            (s) => s.it.toLowerCase() === key,
          )?.eng;
          return { value: label, label: isEng && eng ? eng : label };
        });

      return {
        value,
        label: isEng && taxo?.labelEng ? taxo.labelEng : value,
        subs,
      };
    });
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [products, macroCats, filterGroups] = await Promise.all([
    getAllProducts(),
    getMacroCategories(),
    getUserFilterGroups(),
  ]);

  const macros = buildShopMacros(products, macroCats, locale);

  // Pre-renderizziamo tutte le card lato server (i18n + next/image) e le
  // passiamo al browser client, che filtra per macro/sottocategoria/filtri
  // utente e fa lo scroll infinito. SOLO i nuovi campi di categorizzazione.
  const cards: ShopCard[] = products.map((product, i) => ({
    id: product.id,
    macroId: product.macroId,
    subcategory: product.subcategory ?? '',
    userFilters: product.userFilters ?? [],
    node: (
      <ProductCard
        product={product}
        locale={locale}
        priority={i < 5}
        showFormats={false}
      />
    ),
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <ShopBrowser cards={cards} macros={macros} filterGroups={filterGroups} />
    </div>
  );
}
