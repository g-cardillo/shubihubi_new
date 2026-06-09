import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from '@/lib/auth/session';

/**
 * Gestione del session cookie Firebase.
 *
 * POST { idToken }  → verifica l'ID token (client) e crea un session cookie
 *                     httpOnly (Admin SDK `createSessionCookie`).
 * DELETE            → cancella il cookie (logout lato server).
 *
 * Il cookie consente la verifica della sessione lato server/SSR e il guard di
 * presenza nel middleware per le route protette.
 */
export async function POST(req: NextRequest) {
  const { idToken } = await req.json().catch(() => ({ idToken: undefined }));
  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json({ ok: false, error: 'missing idToken' }, { status: 400 });
  }

  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_MS / 1000,
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid idToken' }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
