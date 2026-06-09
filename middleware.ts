import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Sotto-pagine profilo protette (la gate /profile è pubblica e gestisce login).
// NB: il nome del cookie è hardcoded ('session') perché il middleware gira su
// edge runtime e non può importare lib/auth/session.ts (server-only + Admin SDK).
const PROTECTED = /^\/(it|en)\/profile\/.+/;

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const match = pathname.match(PROTECTED);

  if (match && !req.cookies.get('session')) {
    const url = req.nextUrl.clone();
    url.pathname = `/${match[1]}/profile`;
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req);
}

export const config = {
  // Applica a tutte le route tranne API, file statici Next e asset con estensione.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
