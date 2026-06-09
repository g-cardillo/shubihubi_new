'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCheckout } from './CheckoutProvider';

/**
 * Box pagamento: scelta metodo, avviso dazi, bottone paga (con validazione),
 * testo legale con link. Replica `_PayBox` di `CheckoutPage.dart`.
 */
export function PayBox() {
  const t = useTranslations('checkout');
  const c = useCheckout();
  const [errors, setErrors] = useState<string[]>([]);

  async function handlePay() {
    if (c.isPaying) return;
    const errs = c.validationErrors();
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    try {
      await c.pay();
    } catch {
      setErrors(['err_order_create']);
    }
  }

  const isStripe = c.method === 'stripe';

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-neutral-900">{t('payment')}</h2>

      <div className="mt-3 flex flex-col gap-2">
        <MethodRadio
          label={t('pay_stripe_label')}
          checked={isStripe}
          onChange={() => c.setMethod('stripe')}
        />
        <MethodRadio
          label={t('pay_paypal_label')}
          checked={!isStripe}
          onChange={() => c.setMethod('paypal')}
        />
      </div>

      {!c.isEu && (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {t('customs_warning')}
        </p>
      )}

      {/* ── Errori di validazione ──────────────────────────────────────────── */}
      {errors.length > 0 && (
        <div className="mt-4 rounded-lg border border-brand-red bg-brand-red/5 p-3">
          <p className="text-sm font-semibold text-brand-red">{t('validation_title')}</p>
          <ul className="mt-1 list-disc pl-5 text-xs text-brand-red">
            {errors.map((e) => (
              <li key={e}>{t(e)}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={c.isPaying}
        className={`mt-4 flex h-[52px] w-full items-center justify-center rounded-full px-6 text-base font-semibold text-white transition disabled:opacity-60 ${
          isStripe ? 'bg-brand-pink hover:brightness-105' : 'bg-[#0070E0] hover:bg-[#0059b3]'
        }`}
      >
        {c.isPaying ? '…' : t('go_pay')}
      </button>

      {/* ── Testo legale ───────────────────────────────────────────────────── */}
      <p className="mt-3 text-xs leading-relaxed text-neutral-500">
        {t('legal_pre')}
        <Link href="/terms-of-service" className="underline">
          {t('legal_terms')}
        </Link>
        {t('legal_mid')}
        <Link href="/shipping-policy" className="underline">
          {t('legal_shipping')}
        </Link>
        {t('legal_post')}
      </p>
    </section>
  );
}

function MethodRadio({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
        checked ? 'border-brand-pink bg-brand-pink/5/50' : 'border-neutral-200'
      }`}
    >
      <input type="radio" checked={checked} onChange={onChange} className="h-4 w-4" />
      <span className="text-neutral-800">{label}</span>
    </label>
  );
}
