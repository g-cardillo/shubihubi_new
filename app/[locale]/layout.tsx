import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { CartProvider } from '@/components/cart/CartProvider';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { CookieConsentProvider } from '@/lib/cookies/CookieConsentProvider';
import { CookieBanner } from '@/components/cookie/CookieBanner';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { fontVariables } from '../fonts';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Shubihubi',
  description:
    'Shubihubi — illustrazioni personalizzate, live painting e stationery per eventi.',
  metadataBase: new URL('https://shubihubi.com'),
};

// Pre-genera le route statiche per ogni locale (it, en).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Abilita il rendering statico con next-intl.
  setRequestLocale(locale);

  return (
    <html lang={locale} className={fontVariables}>
      <body>
        <NextIntlClientProvider>
          <AuthProvider>
            <CartProvider>
              <CookieConsentProvider>
                <div className="flex min-h-screen flex-col">
                  <Navbar />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
                <CookieBanner />
              </CookieConsentProvider>
            </CartProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
