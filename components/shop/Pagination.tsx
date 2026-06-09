import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

/**
 * Paginazione link-based (crawlabile) per la pagina shop.
 * Costruisce gli href preservando la categoria attiva.
 */
export async function Pagination({
  page,
  pageCount,
  category,
}: {
  page: number;
  pageCount: number;
  category: string;
}) {
  const t = await getTranslations('shop');
  if (pageCount <= 1) return null;

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (category) params.set('cat', category);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `/shop?${qs}` : '/shop';
  };

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav
      aria-label={t('pagination')}
      className="mt-12 flex items-center justify-center gap-1"
    >
      <PageLink href={hrefFor(page - 1)} disabled={page <= 1}>
        ‹ {t('prev')}
      </PageLink>

      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`min-w-9 rounded-md px-3 py-2 text-center text-sm transition ${
            p === page
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-700 hover:bg-neutral-100'
          }`}
        >
          {p}
        </Link>
      ))}

      <PageLink href={hrefFor(page + 1)} disabled={page >= pageCount}>
        {t('next')} ›
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-md px-3 py-2 text-sm text-neutral-300">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100"
    >
      {children}
    </Link>
  );
}
