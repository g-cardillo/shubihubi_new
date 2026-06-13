'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { getIdTokenResult, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useCartStore } from '@/lib/cart/store';
import { availableQty } from '@/lib/types/cart';
import {
  IconHome,
  IconShop,
  IconGallery,
  IconAbout,
  IconContacts,
  IconProfile,
  IconCart,
  IconAdmin,
  IconCaret,
} from './icons';

/**
 * Navbar globale (replica `NavigationMenu` di Flutter, versione web).
 *
 * Allineamento Flutter: logo a sinistra, link di navigazione spinti a destra
 * subito prima delle azioni (lingua/admin/profilo/carrello). "Home" ha un
 * sottomenu (Home / Live Painting / Stationery): su desktop si apre in hover,
 * su mobile con una freccia che espande la voce nel drawer. Le icone sono le
 * stesse del Flutter: Iconsax (nav/drawer) e Material Outlined (azioni).
 */
type SubLink = { href: string; key: string };
type NavLink = {
  href: string;
  key: string;
  Icon: (p: { className?: string }) => JSX.Element;
  children?: SubLink[];
};

const HOME_CHILDREN: SubLink[] = [
  { href: '/', key: 'home' },
  { href: '/live-painting', key: 'live_painting' },
  { href: '/stationery', key: 'stationery' },
];

const LINKS: NavLink[] = [
  { href: '/', key: 'home', Icon: IconHome, children: HOME_CHILDREN },
  { href: '/shop', key: 'shop', Icon: IconShop },
  { href: '/gallery', key: 'gallery', Icon: IconGallery },
  { href: '/about', key: 'about', Icon: IconAbout },
  { href: '/contacts', key: 'contacts', Icon: IconContacts },
];

const SUBPAGE_HREFS = ['/live-painting', '/stationery'];

/**
 * Comportamento navbar al variare della rotta (parità col Flutter
 * `NavigationMenu`):
 *  - `'overlayScroll'` (Home): navbar in overlay sull'hero, sfondo
 *    trasparente → bianco e testo bianco → scuro in base allo scroll.
 *  - `'overlayDark'` (Gallery, About): overlay con sfondo trasparente → bianco
 *    a scroll, ma testo SEMPRE scuro.
 *  - `'solid'` (Shop, Contacts, Live Painting, Stationery e tutto il resto):
 *    sfondo bianco fisso, testo scuro. (`Events` nel Flutter è scroll-based,
 *    ma qui ha un hero chiaro a righe → resta solido, il testo scuro è
 *    leggibile.)
 */
const OVERLAY_DARK_TEXT = ['/gallery', '/about'];
/** Distanza di scroll (px) per il fade completo, come `fadeDistance` Flutter. */
const NAV_FADE = 160;

type NavMode = 'solid' | 'overlayDark' | 'overlayScroll';

function navModeFor(pathname: string): NavMode {
  if (pathname === '/') return 'overlayScroll';
  if (OVERLAY_DARK_TEXT.includes(pathname)) return 'overlayDark';
  return 'solid';
}

export function Navbar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [homeExpanded, setHomeExpanded] = useState(false);
  const isAdmin = useIsAdmin();

  const toggleCart = useCartStore((s) => s.toggle);
  const hydrated = useCartStore((s) => s.hydrated);
  // Il badge conta solo gli articoli DISPONIBILI: i soldOut non sono acquistabili.
  const count = useCartStore((s) => availableQty(s.items));

  // Pop del badge carrello quando la quantità AUMENTA: incrementare la key
  // rimonta lo span e fa ripartire l'animazione `badge-pop`. Il baseline parte
  // dopo l'idratazione da localStorage, così il primo render non "poppa".
  const prevCount = useRef<number | null>(null);
  const [popKey, setPopKey] = useState(0);
  useEffect(() => {
    if (!hydrated) return;
    const prev = prevCount.current;
    prevCount.current = count;
    if (prev !== null && count > prev) setPopKey((k) => k + 1);
  }, [hydrated, count]);

  // Modalità navbar in base alla rotta + progressione di scroll [0..1].
  const mode = navModeFor(pathname);
  const overlay = mode !== 'solid';
  const scrollText = mode === 'overlayScroll';
  const [scrollT, setScrollT] = useState(0);

  useEffect(() => {
    if (!overlay) {
      setScrollT(0);
      return;
    }
    const onScroll = () =>
      setScrollT(Math.min(1, Math.max(0, window.scrollY / NAV_FADE)));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [overlay, pathname]);

  // A menu aperto la riga è sempre piena (bianca) per accordarsi col pannello.
  const bgAlpha = overlay ? (menuOpen ? 1 : scrollT) : 1;
  // Testo: scuro fisso, oppure (Home) interpolato bianco → ink in base a `scrollT`.
  const lerp = (from: number, to: number) =>
    Math.round(from + (to - from) * scrollT);
  const fgColor = scrollText
    ? menuOpen
      ? 'rgb(29, 29, 31)'
      : `rgb(${lerp(255, 29)}, ${lerp(255, 29)}, ${lerp(255, 31)})`
    : undefined;

  // Chiude il menu mobile a ogni cambio rotta.
  useEffect(() => {
    setMenuOpen(false);
    setHomeExpanded(false);
  }, [pathname]);

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }
  // "Home" è attiva anche sulle sue sottopagine.
  const homeGroupActive = pathname === '/' || SUBPAGE_HREFS.includes(pathname);

  return (
    <header
      className={
        overlay
          ? `fixed inset-x-0 top-0 z-40${scrollText ? '' : ' text-ink'}`
          : 'sticky top-0 z-40 border-b border-neutral-100 bg-white text-ink'
      }
      style={
        overlay
          ? {
              backgroundColor: `rgba(255, 255, 255, ${bgAlpha})`,
              borderBottom: `1px solid rgba(229, 229, 229, ${bgAlpha})`,
              color: fgColor,
            }
          : undefined
      }
    >
      <nav className="mx-auto flex h-16 max-w-content items-center gap-4 px-4 desk:px-6">
        {/* Hamburger (mobile) */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={menuOpen}
          className="-ml-1 flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 desk:hidden"
        >
          {menuOpen ? <CloseGlyph /> : <MenuGlyph />}
        </button>

        {/* Logo — all'hover (solo desktop) blob e wordmark oscillano ±5°,
            2 cicli, con il testo in ritardo di 100ms (vedi .logo-hover). */}
        <Link href="/" className="logo-hover flex items-center gap-2" aria-label="Shubihubi">
          <span className="relative block h-8 w-8 overflow-hidden rounded-full">
            <Image src="/logo.webp" alt="Shubihubi" fill sizes="32px" className="logo-blob object-cover" priority />
          </span>
          <span className="logo-blob logo-blob-delayed inline-block font-special text-xl text-brand-pink">
            Shubi hubi
          </span>
        </Link>

        <div className="flex-1" />

        {/* Link desktop (a destra, come Flutter) */}
        <div className="hidden items-center gap-1 desk:flex">
          {LINKS.map((l) =>
            l.children ? (
              <HomeDropdown
                key={l.href}
                label={t(l.key)}
                active={homeGroupActive}
                items={l.children}
                t={t}
              />
            ) : (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3 py-2 text-[15px] transition-colors ${
                  isActive(l.href)
                    ? 'font-semibold text-brand-pink'
                    : 'font-normal hover:text-brand-pink'
                }`}
              >
                {t(l.key)}
              </Link>
            ),
          )}
        </div>

        {/* Azioni */}
        <div className="flex items-center gap-1">
          <LangSwitcher />

          {isAdmin && (
            <Link
              href="/admin"
              aria-label="Admin"
              title="Admin Panel"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100"
            >
              <IconAdmin className="h-[22px] w-[22px]" />
            </Link>
          )}

          <Link
            href="/profile"
            aria-label={t('profile')}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100"
          >
            <IconProfile className="h-[22px] w-[22px]" />
          </Link>

          <button
            type="button"
            onClick={toggleCart}
            aria-label={t('cart')}
            className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100"
          >
            <IconCart className="h-[22px] w-[22px]" />
            {hydrated && count > 0 && (
              <span
                key={popKey}
                className={`absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-pink px-1 text-[11px] font-extrabold text-white ${
                  popKey > 0 ? 'badge-pop' : ''
                }`}
              >
                {count}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Menu mobile (drawer) */}
      {menuOpen && (
        <div className="border-t border-neutral-100 bg-white px-2 py-2 desk:hidden">
          {LINKS.map((l) => {
            const Icon = l.Icon;
            if (l.children) {
              return (
                <div key={l.href}>
                  {/* L'intera riga "Home" apre/chiude il sottomenù (come la
                      ExpansionTile del drawer Flutter). La voce Home vera e
                      propria è la prima del sottomenù. */}
                  <button
                    type="button"
                    onClick={() => setHomeExpanded((o) => !o)}
                    aria-expanded={homeExpanded}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base ${
                      homeGroupActive ? 'font-semibold text-brand-pink' : 'text-ink'
                    }`}
                  >
                    <Icon className="h-[22px] w-[22px]" />
                    {t(l.key)}
                    <IconCaret
                      className={`ml-auto h-5 w-5 transition-transform ${homeExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {homeExpanded && (
                    <div className="mb-1 ml-[34px] border-l border-neutral-100 pl-2">
                      {l.children.map((c) => (
                        <Link
                          key={c.href}
                          href={c.href}
                          className={`block rounded-lg px-3 py-2.5 text-[15px] ${
                            isActive(c.href)
                              ? 'font-semibold text-brand-pink'
                              : 'text-ink hover:bg-neutral-50'
                          }`}
                        >
                          {t(c.key)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base ${
                  isActive(l.href)
                    ? 'font-semibold text-brand-pink'
                    : 'text-ink hover:bg-neutral-50'
                }`}
              >
                <Icon className="h-[22px] w-[22px]" />
                {t(l.key)}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}

/** "Home" desktop con sottomenu in hover (Home / Live Painting / Stationery). */
function HomeDropdown({
  label,
  active,
  items,
  t,
}: {
  label: string;
  active: boolean;
  items: SubLink[];
  t: (k: string) => string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const [open, setOpen] = useState(false);

  // Si chiude dopo un click che cambia rotta (oltre che on click esplicito).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href="/"
        onClick={() => setOpen(false)}
        className={`flex items-center gap-0.5 rounded-full px-3 py-2 text-[15px] transition-colors ${
          active ? 'font-semibold text-brand-pink' : 'font-normal hover:text-brand-pink'
        }`}
      >
        {label}
        <IconCaret
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </Link>

      {/* pt-2 fa da ponte sul gap, così l'hover non si interrompe. */}
      <div
        className={`absolute left-1/2 top-full z-50 min-w-[190px] -translate-x-1/2 pt-2 transition-opacity duration-150 ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <ul className="overflow-hidden rounded-xl border border-neutral-100 bg-white py-1 shadow-lg">
          {items.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                onClick={() => setOpen(false)}
                className={`block px-5 py-2.5 text-[15px] transition-colors ${
                  isActive(c.href)
                    ? 'font-semibold text-brand-pink'
                    : 'text-ink hover:bg-neutral-50'
                }`}
              >
                {t(c.key)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MenuGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden className="h-6 w-6">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden className="h-6 w-6">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
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
      className="flex h-10 items-center gap-0.5 rounded-full px-2 text-base hover:bg-neutral-100"
    >
      <span aria-hidden>{locale === 'it' ? '🇮🇹' : '🇬🇧'}</span>
      <span className="text-xs font-semibold">{locale.toUpperCase()}</span>
      <IconCaret className="h-4 w-4" />
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
