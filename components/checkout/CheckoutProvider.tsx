'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useCartStore } from '@/lib/cart/store';
import { subtotal as cartSubtotal } from '@/lib/types/cart';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useMailingList } from '@/lib/hooks/useMailingList';
import { loadAddresses, type UserAddress } from '@/lib/profile/firestore';
import { computeShippingCost } from '@/lib/checkout/shipping';
import { isEuCountry, type InvoiceType, type PayMethod } from '@/lib/checkout/constants';
import {
  capturePaypalOrder,
  createDraftOrder,
  createPaypalOrder,
  createStripeCheckoutSession,
  validateDiscountCode,
  validateGiftCard,
  type DraftOrderPayload,
} from '@/lib/checkout/repository';

/**
 * Stato + logica del checkout — fonde `CheckoutFormController` e
 * `CheckoutController` di Flutter in un unico provider React. La pagina e i
 * sotto-componenti (form, riepilogo, paybox) leggono da qui via `useCheckout()`.
 */

// ── Stato form (replica CheckoutFormController) ──────────────────────────────

export interface FormState {
  email: string;
  emailConfirm: string;
  firstName: string;
  lastName: string;
  phone: string;

  shipLine1: string;
  shipLine2: string;
  shipCity: string;
  shipPostal: string;
  shipProvince: string;
  shipCountry: string;
  shipRecipientName: string;
  shipCompany: string;

  billingSameAsShipping: boolean;
  billLine1: string;
  billLine2: string;
  billCity: string;
  billPostal: string;
  billProvince: string;
  billCountry: string;

  wantsInvoice: boolean;
  invoiceType: InvoiceType;
  codiceFiscale: string;
  partitaIva: string;
  ragioneSociale: string;
  sdi: string;
  pec: string;
  vatId: string;
}

const EMPTY_FORM: FormState = {
  email: '', emailConfirm: '', firstName: '', lastName: '', phone: '',
  shipLine1: '', shipLine2: '', shipCity: '', shipPostal: '', shipProvince: '',
  shipCountry: 'IT', shipRecipientName: '', shipCompany: '',
  billingSameAsShipping: true,
  billLine1: '', billLine2: '', billCity: '', billPostal: '', billProvince: '',
  billCountry: 'IT',
  wantsInvoice: false, invoiceType: 'private',
  codiceFiscale: '', partitaIva: '', ragioneSociale: '', sdi: '', pec: '', vatId: '',
};

interface CheckoutContextValue {
  form: FormState;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;

  // Totali calcolati (per il riepilogo a schermo)
  subtotal: number;
  discountAmount: number;
  discountedSubtotal: number;
  shipping: number;
  isFreeShipping: boolean;
  giftCardAmount: number;
  total: number;
  isEu: boolean;

  // Sconto
  discountCode: string | null;
  discountPercent: number;
  discountError: string | null;
  isCheckingCode: boolean;
  applyDiscountCode: (input: string) => Promise<void>;
  removeDiscountCode: () => void;

  // Buono
  giftCardCode: string | null;
  giftCardError: string | null;
  isCheckingGiftCard: boolean;
  applyGiftCard: (input: string) => Promise<void>;
  removeGiftCard: () => void;

  // Pagamento
  method: PayMethod;
  setMethod: (m: PayMethod) => void;
  isPaying: boolean;
  validationErrors: () => string[];
  pay: () => Promise<void>;

  // Banner profilo
  profileShipping: UserAddress | null;
  profileBillingVisible: boolean;
  applyProfileAddress: () => void;
  dismissProfileBanner: () => void;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { addEmail } = useMailingList();
  const items = useCartStore((s) => s.items);
  const availableItems = useMemo(() => items.filter((i) => !i.soldOut), [items]);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) =>
      setForm((f) => ({ ...f, [key]: value })),
    [],
  );

  // Sconto / buono
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  const [giftCardCode, setGiftCardCode] = useState<string | null>(null);
  const [giftCardAmountCents, setGiftCardAmountCents] = useState(0);
  const [giftCardError, setGiftCardError] = useState<string | null>(null);
  const [isCheckingGiftCard, setIsCheckingGiftCard] = useState(false);

  // Pagamento
  const [method, setMethod] = useState<PayMethod>('stripe');
  const [isPaying, setIsPaying] = useState(false);

  // Banner profilo
  const [profileShipping, setProfileShipping] = useState<UserAddress | null>(null);
  const [profileBilling, setProfileBilling] = useState<UserAddress | null>(null);
  const [bannerVisible, setBannerVisible] = useState(true);
  const profileEmail = useRef<string | null>(null);

  // ── Totali (replica _OrderSummary di Flutter) ──────────────────────────────
  const subtotal = cartSubtotal(items);
  const discountAmount = discountPercent > 0 ? (subtotal * discountPercent) / 100 : 0;
  const discountedSubtotal = subtotal - discountAmount;
  const shipping = computeShippingCost(form.shipCountry, discountedSubtotal);
  const isFreeShipping = form.shipCountry.toUpperCase() === 'IT' && shipping === 0;
  const giftCardAmount = giftCardAmountCents / 100;
  const total = Math.max(0, discountedSubtotal + shipping - giftCardAmount);
  const isEu = isEuCountry(form.shipCountry);

  // ── Prefill indirizzo dal profilo (banner) ─────────────────────────────────
  useEffect(() => {
    if (!user) {
      setProfileShipping(null);
      setProfileBilling(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { shipping: s, billing: b } = await loadAddresses(user.uid);
      if (cancelled) return;
      profileEmail.current = user.email;
      setProfileShipping(s);
      setProfileBilling(b);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const applyProfileAddress = useCallback(() => {
    const s = profileShipping;
    if (!s) return;
    const b = profileBilling;
    setForm((f) => {
      const next: FormState = {
        ...f,
        email: f.email || profileEmail.current || f.email,
        firstName: s.firstName,
        lastName: s.lastName,
        phone: s.phone || f.phone,
        shipLine1: s.address,
        shipLine2: s.addressNotes,
        shipPostal: s.postalCode,
        shipCity: s.city,
        shipProvince: s.province,
        shipCountry: s.country || f.shipCountry,
      };
      const billEmpty =
        !b ||
        (!b.address && !b.city && !b.postalCode && !b.firstName && !b.lastName);
      if (b && !billEmpty) {
        next.billingSameAsShipping = false;
        next.billLine1 = b.address;
        next.billLine2 = b.addressNotes;
        next.billPostal = b.postalCode;
        next.billCity = b.city;
        next.billProvince = b.province;
        next.billCountry = b.country || f.billCountry;
      } else {
        next.billingSameAsShipping = true;
      }
      return next;
    });
    setBannerVisible(false);
  }, [profileShipping, profileBilling]);

  const dismissProfileBanner = useCallback(() => setBannerVisible(false), []);

  const profileBannerHasAddress =
    !!profileShipping &&
    !(
      !profileShipping.firstName &&
      !profileShipping.lastName &&
      !profileShipping.address &&
      !profileShipping.city &&
      !profileShipping.postalCode
    );

  // ── Sconto ─────────────────────────────────────────────────────────────────
  const applyDiscountCode = useCallback(
    async (input: string) => {
      const c = input.trim().toUpperCase();
      if (!c) return;
      setIsCheckingCode(true);
      setDiscountError(null);
      try {
        const res = await validateDiscountCode(c, subtotal);
        if (res.error || !res.value) {
          setDiscountError(res.error);
          return;
        }
        setDiscountCode(res.value.code);
        setDiscountPercent(res.value.percent);
      } catch {
        setDiscountError('discount_err_generic');
      } finally {
        setIsCheckingCode(false);
      }
    },
    [subtotal],
  );

  const removeDiscountCode = useCallback(() => {
    setDiscountCode(null);
    setDiscountPercent(0);
    setDiscountError(null);
  }, []);

  // ── Buono ──────────────────────────────────────────────────────────────────
  const applyGiftCard = useCallback(async (input: string) => {
    const c = input.trim().toUpperCase();
    if (!c) return;
    setIsCheckingGiftCard(true);
    setGiftCardError(null);
    try {
      const res = await validateGiftCard(c);
      if (res.error || !res.value) {
        setGiftCardError(res.error);
        return;
      }
      setGiftCardCode(res.value.code);
      setGiftCardAmountCents(res.value.amountCents);
    } catch {
      setGiftCardError('gift_err_generic');
    } finally {
      setIsCheckingGiftCard(false);
    }
  }, []);

  const removeGiftCard = useCallback(() => {
    setGiftCardCode(null);
    setGiftCardAmountCents(0);
    setGiftCardError(null);
  }, []);

  // ── Validazione (replica CheckoutFormController.validationErrors) ───────────
  const emailsMatch =
    form.email.trim().toLowerCase() === form.emailConfirm.trim().toLowerCase();

  const validationErrors = useCallback((): string[] => {
    const e: string[] = [];
    if (!emailsMatch) e.push('err_email_mismatch');
    if (!form.email.includes('@')) e.push('err_email_invalid');
    if (!form.firstName.trim()) e.push('err_first_name');
    if (!form.lastName.trim()) e.push('err_last_name');
    if (!form.phone.trim()) e.push('err_phone');
    if (!form.shipLine1.trim()) e.push('err_ship_address');
    if (!form.shipCity.trim()) e.push('err_ship_city');
    if (!form.shipPostal.trim()) e.push('err_ship_postal');
    if (!form.shipCountry.trim()) e.push('err_ship_country');

    if (form.wantsInvoice) {
      const bc = form.billingSameAsShipping ? form.shipCountry : form.billCountry;
      const isIT = bc.toUpperCase() === 'IT';
      if (form.invoiceType === 'private') {
        if (isIT && !form.codiceFiscale.trim()) e.push('err_codice_fiscale');
      } else {
        if (isIT && !form.partitaIva.trim()) e.push('err_partita_iva');
        if (!form.ragioneSociale.trim()) e.push('err_ragione_sociale');
      }
    }
    return e;
  }, [form, emailsMatch]);

  // ── Payload (replica CheckoutController.buildPayload) ───────────────────────
  const buildPayload = useCallback((): DraftOrderPayload => {
    const f = form;
    const shippingObj = {
      recipientName: f.shipRecipientName.trim() ||
        `${f.firstName.trim()} ${f.lastName.trim()}`.trim(),
      company: f.shipCompany.trim(),
      line1: f.shipLine1.trim(),
      line2: f.shipLine2.trim(),
      city: f.shipCity.trim(),
      postalCode: f.shipPostal.trim(),
      province: f.shipProvince.trim(),
      country: f.shipCountry.trim().toUpperCase(),
    };

    const same = f.billingSameAsShipping;
    const billing = {
      sameAsShipping: same,
      line1: same ? shippingObj.line1 : f.billLine1.trim(),
      line2: same ? shippingObj.line2 : f.billLine2.trim(),
      city: same ? shippingObj.city : f.billCity.trim(),
      postalCode: same ? shippingObj.postalCode : f.billPostal.trim(),
      province: same ? shippingObj.province : f.billProvince.trim(),
      country: same ? shippingObj.country : f.billCountry.trim().toUpperCase(),
    };

    const billingCountry = (billing.country as string) || 'IT';
    const invoice = {
      enabled: f.wantsInvoice,
      type: f.invoiceType,
      billingCountry,
      codiceFiscale: f.codiceFiscale.trim(),
      partitaIva: f.partitaIva.trim(),
      ragioneSociale: f.ragioneSociale.trim(),
      sdi: f.sdi.trim(),
      pec: f.pec.trim(),
      vatId: f.vatId.trim(),
    };

    const customer = {
      email: f.email.trim(),
      firstName: f.firstName.trim(),
      lastName: f.lastName.trim(),
      phone: f.phone.trim(),
      uid: user?.uid ?? null,
      isGuest: !user,
    };

    const lineItems = availableItems.map((it) => ({
      productId: it.productId,
      qty: it.qty,
      options: it.options,
      ...(it.note ? { note: it.note } : {}),
    }));

    return {
      items: lineItems,
      customer,
      shipping: shippingObj,
      billing,
      invoice,
      currency: 'eur',
      userId: user ? user.uid : 'guest',
      shippingCents: Math.round(computeShippingCost(f.shipCountry, subtotal) * 100),
      ...(discountCode ? { discountCode } : {}),
      ...(giftCardCode ? { giftCardCode } : {}),
    };
  }, [form, user, availableItems, subtotal, discountCode, giftCardCode]);

  // ── Flusso pagamento (replica startPayment / PayBox onPressed) ──────────────
  const pay = useCallback(async () => {
    if (isPaying) return;
    setIsPaying(true);
    try {
      const payload = buildPayload();
      const id = await createDraftOrder(payload);
      if (!id) {
        throw new Error('order_create_failed');
      }
      // Best-effort mailing list (gated dal consenso marketing), come il
      // `checkout_controller` del Flutter (`source: 'checkout'`).
      void addEmail(payload.customer.email, 'checkout');
      if (method === 'stripe') {
        const url = await createStripeCheckoutSession(id);
        window.location.href = url;
      } else {
        const url = await createPaypalOrder(id);
        window.location.href = url;
      }
    } finally {
      // Se il redirect non parte (errore), riabilita il bottone.
      setIsPaying(false);
    }
  }, [isPaying, buildPayload, method, addEmail]);

  const value: CheckoutContextValue = {
    form,
    setField,
    subtotal,
    discountAmount,
    discountedSubtotal,
    shipping,
    isFreeShipping,
    giftCardAmount,
    total,
    isEu,
    discountCode,
    discountPercent,
    discountError,
    isCheckingCode,
    applyDiscountCode,
    removeDiscountCode,
    giftCardCode,
    giftCardError,
    isCheckingGiftCard,
    applyGiftCard,
    removeGiftCard,
    method,
    setMethod,
    isPaying,
    validationErrors,
    pay,
    profileShipping: bannerVisible && profileBannerHasAddress ? profileShipping : null,
    profileBillingVisible: bannerVisible && profileBannerHasAddress,
    applyProfileAddress,
    dismissProfileBanner,
  };

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckout(): CheckoutContextValue {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckout deve essere usato dentro <CheckoutProvider>');
  return ctx;
}

// Capture helper riesportato per la pagina di ritorno PayPal.
export { capturePaypalOrder };
