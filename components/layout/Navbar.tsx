'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { getIdTokenResult, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useCartStore } from '@/lib/cart/store';
import { totalQty } from '@/lib/types/cart';

/**
 * Navbar globale (replica `NavigationMenu` di Flutter, versione web).
 *
 * Sticky bianca, h-16 (64px), elevation 0 come l'`appBarTheme`. Logo circolare
 * 32px, link inline su desktop (≥ desk/900px) e menu hamburger sotto. Azioni:
 * switch lingua IT/EN, profilo, admin (solo admin), carrello con badge rosa.
 *
 * NB: la trasparenza-su-hero del Flutter (che dipende dallo scroll della home)
 * non è replicata: qui la navbar è bianca piena, fedele al tema base.
 */
const LINKS = [
  { href: '/', key: 'home' },
  { href: '/shop', key: 'shop' },
  { href: '/gallery', key: 'gallery' },
  { href: '/about', key: 'about' },
  { href: '/contacts', key: 'contacts' },
] as const;

export function Navbar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = useIsAdmin();

  const toggleCart = useCartStore((s) => s.toggle);
  const hydrated = useCartStore((s) => s.hydrated);
  const count = useCartStore((s) => totalQty(s.items));

  // Chiude il menu mobile a ogni cambio rotta.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white">
      <nav className="mx-auto flex h-16 max-w-content items-center gap-4 px-4 desk:px-6">
        {/* Hamburger (mobile) */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={menuOpen}
          className="desk:hidden -ml-1 flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-neutral-100"
        >
          <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="Shubihubi">
          <span className="relative block h-8 w-8 overflow-hidden rounded-full">
            <Image src="/logo.webp" alt="Shubihubi" fill sizes="32px" className="object-cover" priority />
          </span>
          <span className="font-special text-xl text-brand-pink">Shubihubi</span>
        </Link>

        {/* Link desktop */}
        <div className="ml-4 hidden items-center gap-1 desk:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-2 text-[15px] transition-colors ${
                isActive(l.href)
                  ? 'font-semibold text-brand-pink'
                  : 'font-normal text-ink hover:text-brand-pink'
              }`}
            >
              {t(l.key)}
            </Link>
          ))}
        </div>

        <div className="flex-1" />

        {/* Azioni */}
        <div className="flex items-center gap-1">
          <LangSwitcher />

          {isAdmin && (
            <Link
              href="/admin"
              aria-label="Admin"
              title="Admin Panel"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-neutral-100"
            >
              <span className="text-lg">⚙️</span>
            </Link>
          )}

          <Link
            href="/profile"
            aria-label={t('profile')}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-neutral-100"
          >
            <span className="text-lg">👤</span>
          </Link>

          <button
            type="button"
            onClick={toggleCart}
            aria-label={t('cart')}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-neutral-100"
          >
            <span className="text-lg">🛍️</span>
            {hydrated && count > 0 && (
              <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-pink px-1 text-[11px] font-extrabold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="border-t border-neutral-100 bg-white px-4 py-2 desk:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-lg px-3 py-3 text-base ${
                isActive(l.href)
                  ? 'font-semibold text-brand-pink'
                  : 'text-ink hover:bg-neutral-50'
              }`}
            >
              {t(l.key)}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

/** Selettore lingua IT/EN: cambia locale mantenendo la rotta corrente. */
function LangSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const other = locale === 'it' ? 'en' : 'it';

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: other })}
      aria-label={`Switch to ${other.toUpperCase()}`}
      title={other.toUpperCase()}
      className="flex h-10 items-center gap-1 rounded-full px-2 text-base hover:bg-neutral-100"
    >
      <span aria-hidden>{locale === 'it' ? '🇮🇹' : '🇬🇧'}</span>
      <span className="text-xs font-semibold text-ink">{locale.toUpperCase()}</span>
    </button>
  );
}

/** True se l'utente loggato ha il custom claim admin (per mostrare il link). */
function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!cancelled) setIsAdmin(false);
        return;
      }
      try {
        const res = await getIdTokenResult(user);
        if (!cancelled) setIsAdmin(res.claims.admin === true);
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);
  return isAdmin;
}
