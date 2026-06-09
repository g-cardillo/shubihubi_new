'use client';

/**
 * Call-site dei pagamenti — replica fedele dei repository Flutter
 * (`payment_repository_impl.dart`, `discount_repository_impl.dart`).
 *
 * Il BACKEND È INVARIATO: si invocano le stesse Cloud Functions `onCall`
 * (`createDraftOrder`, `stripeCreateCheckoutSession`, `paypalCreateOrder`,
 * `paypalCaptureOrder`) e si leggono direttamente `discount_codes` / `gift_cards`
 * (read pubblico consentito dalle security rules), esattamente come in Flutter.
 */
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase/client';

// ── Payload ordine ───────────────────────────────────────────────────────────

export interface DraftOrderPayload {
  items: Array<{
    productId: string;
    qty: number;
    options: Record<string, string>;
    note?: string;
  }>;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    uid: string | null;
    isGuest: boolean;
  };
  shipping: Record<string, string>;
  billing: Record<string, unknown>;
  invoice: Record<string, unknown>;
  currency: 'eur';
  userId: string;
  shippingCents: number;
  discountCode?: string;
  giftCardCode?: string;
}

// ── Pagamenti (Cloud Functions onCall) ───────────────────────────────────────

/**
 * Crea l'ordine draft lato server. Ritorna l'orderId o `null` in caso di errore
 * (replica `CreateDraftOrder` usecase Flutter, che inghiotte l'eccezione).
 */
export async function createDraftOrder(
  payload: DraftOrderPayload,
): Promise<string | null> {
  try {
    const res = await httpsCallable(functions, 'createDraftOrder')(payload);
    return (res.data as { orderId: string }).orderId;
  } catch (err) {
    console.error('createDraftOrder failed:', err);
    return null;
  }
}

/** Crea la sessione Stripe Checkout e ritorna l'URL di redirect. */
export async function createStripeCheckoutSession(orderId: string): Promise<string> {
  const res = await httpsCallable(functions, 'stripeCreateCheckoutSession')({
    orderId,
    currency: 'eur',
  });
  const url = (res.data as { url?: string }).url;
  if (!url) throw new Error("Stripe non ha restituito l'URL di checkout.");
  return url;
}

/** Crea l'ordine PayPal e ritorna l'approvalUrl di redirect. */
export async function createPaypalOrder(orderId: string): Promise<string> {
  const res = await httpsCallable(functions, 'paypalCreateOrder')({
    orderId,
    currency: 'EUR',
  });
  const url = (res.data as { approvalUrl?: string }).approvalUrl;
  if (!url) throw new Error("PayPal non ha restituito l'URL di approvazione.");
  return url;
}

/** Cattura il pagamento PayPal al ritorno. Ritorna true se completato. */
export async function capturePaypalOrder(paypalOrderId: string): Promise<boolean> {
  const res = await httpsCallable(functions, 'paypalCaptureOrder')({ paypalOrderId });
  return (res.data as { success?: boolean })?.success === true;
}

// ── Validazione codice sconto / buono (read Firestore client) ────────────────

export interface ValidationResult<T> {
  value: T | null;
  error: string | null;
}

export interface DiscountData {
  code: string;
  percent: number;
  minAmount: number | null;
}

export interface GiftCardData {
  code: string;
  amountCents: number;
}

/**
 * Valida un codice sconto contro Firestore (`discount_codes/{CODE}`).
 * Replica `ValidateDiscountCode` usecase Flutter. Gli errori sono chiavi i18n.
 */
export async function validateDiscountCode(
  code: string,
  subtotal: number,
): Promise<ValidationResult<DiscountData>> {
  const snap = await getDoc(doc(db, 'discount_codes', code));
  if (!snap.exists()) return { value: null, error: 'discount_err_invalid' };

  const data = snap.data();
  if (data.used === true) return { value: null, error: 'discount_err_used' };

  const percent = Number(data.discountPercent ?? 0) || 0;
  const minAmountRaw = data.minOrderAmount;
  const minAmount = minAmountRaw != null ? Number(minAmountRaw) : null;

  if (minAmount != null && minAmount > 0 && subtotal < minAmount) {
    return { value: null, error: 'discount_err_min' };
  }

  return { value: { code, percent, minAmount }, error: null };
}

/**
 * Valida un buono contro Firestore (`gift_cards/{CODE}`).
 * Replica `ValidateGiftCard` usecase Flutter.
 */
export async function validateGiftCard(
  code: string,
): Promise<ValidationResult<GiftCardData>> {
  const snap = await getDoc(doc(db, 'gift_cards', code));
  if (!snap.exists()) return { value: null, error: 'gift_err_invalid' };

  const data = snap.data();
  if (data.active === false) return { value: null, error: 'gift_err_used' };

  const amountCents = Number(data.amountCents ?? 0) || 0;
  return { value: { code, amountCents }, error: null };
}
