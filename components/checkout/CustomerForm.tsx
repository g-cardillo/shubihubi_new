'use client';

import { useTranslations } from 'next-intl';
import { COUNTRY_CODES } from '@/lib/checkout/constants';
import { useCheckout, type FormState } from './CheckoutProvider';

/**
 * Form dati cliente / spedizione / fatturazione / fattura.
 * Replica `CheckoutCustomerForm.dart`. Il prefisso telefonico Flutter è qui
 * semplificato a un singolo campo telefono (la validazione resta "non vuoto").
 */
export function CustomerForm() {
  const t = useTranslations('checkout');
  const tc = useTranslations('country');
  const c = useCheckout();
  const f = c.form;

  const field = (key: keyof FormState) => ({
    value: f[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      c.setField(key, e.target.value as never),
  });

  return (
    <div className="flex flex-col gap-3">
      {/* ── Banner profilo ───────────────────────────────────────────────── */}
      {c.profileShipping && (
        <div className="flex items-start gap-2 rounded-xl border border-brand-pinkLight bg-brand-pink/5 p-3">
          <span aria-hidden>📍</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-brand-pinkHot">{t('profile_addr_banner')}</p>
            <p className="text-xs text-neutral-600">
              {[
                `${c.profileShipping.firstName} ${c.profileShipping.lastName}`.trim(),
                c.profileShipping.address,
                [c.profileShipping.postalCode, c.profileShipping.city].filter(Boolean).join(' '),
              ].filter(Boolean).join(', ')}
            </p>
            <button
              type="button"
              onClick={c.applyProfileAddress}
              className="mt-2 rounded-full bg-brand-pink px-4 py-1.5 text-xs font-semibold text-white hover:brightness-105"
            >
              {t('profile_addr_apply')}
            </button>
          </div>
          <button
            type="button"
            onClick={c.dismissProfileBanner}
            aria-label={t('remove')}
            className="text-brand-pink/60 hover:text-brand-pink"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Dati cliente ─────────────────────────────────────────────────── */}
      <h3 className="text-base font-semibold text-neutral-900">{t('customer')}</h3>
      <Input label={t('form_email')} type="email" {...field('email')} />
      <Input
        label={t('form_email_confirm')}
        type="email"
        error={
          f.emailConfirm.length > 0 &&
          f.email.trim().toLowerCase() !== f.emailConfirm.trim().toLowerCase()
            ? t('form_err_email_mismatch')
            : undefined
        }
        {...field('emailConfirm')}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label={t('form_first_name')} {...field('firstName')} />
        <Input label={t('form_last_name')} {...field('lastName')} />
      </div>
      <Input label={t('form_phone')} type="tel" {...field('phone')} />

      {/* ── Spedizione ───────────────────────────────────────────────────── */}
      <h3 className="mt-3 text-base font-semibold text-neutral-900">{t('shipping_addr')}</h3>
      <Input label={t('form_address')} {...field('shipLine1')} />
      <Input label={t('form_address_notes')} {...field('shipLine2')} />
      <div className="grid grid-cols-2 gap-3">
        <Input label={t('form_cap')} {...field('shipPostal')} />
        <Input label={t('form_city')} {...field('shipCity')} />
      </div>
      <Input label={t('form_province')} {...field('shipProvince')} />
      <CountrySelect
        label={t('form_country')}
        value={f.shipCountry}
        onChange={(v) => c.setField('shipCountry', v)}
        tc={tc}
      />
      <Input label={t('form_recipient')} {...field('shipRecipientName')} />
      <Input label={t('form_company')} {...field('shipCompany')} />

      {/* ── Fatturazione ─────────────────────────────────────────────────── */}
      <Checkbox
        label={t('billing_same')}
        checked={f.billingSameAsShipping}
        onChange={(v) => c.setField('billingSameAsShipping', v)}
      />
      {!f.billingSameAsShipping && (
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold text-neutral-900">{t('billing_addr')}</h3>
          <Input label={t('form_address')} {...field('billLine1')} />
          <Input label={t('form_address_notes')} {...field('billLine2')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('form_cap')} {...field('billPostal')} />
            <Input label={t('form_city')} {...field('billCity')} />
          </div>
          <Input label={t('form_province')} {...field('billProvince')} />
          <CountrySelect
            label={t('form_country')}
            value={f.billCountry}
            onChange={(v) => c.setField('billCountry', v)}
            tc={tc}
          />
        </div>
      )}

      {/* ── Fattura ──────────────────────────────────────────────────────── */}
      <h3 className="mt-3 text-base font-semibold text-neutral-900">{t('invoice_section')}</h3>
      <Checkbox
        label={t('invoice_want')}
        checked={f.wantsInvoice}
        onChange={(v) => c.setField('wantsInvoice', v)}
      />
      {f.wantsInvoice && <InvoiceFields />}
    </div>
  );
}

function InvoiceFields() {
  const t = useTranslations('checkout');
  const c = useCheckout();
  const f = c.form;
  const billingCountry = f.billingSameAsShipping ? f.shipCountry : f.billCountry;
  const isIT = billingCountry.toUpperCase() === 'IT';
  const isCompany = f.invoiceType === 'company';

  const field = (key: keyof FormState) => ({
    value: f[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      c.setField(key, e.target.value as never),
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">
        <Radio
          label={t('invoice_type_private')}
          checked={f.invoiceType === 'private'}
          onChange={() => c.setField('invoiceType', 'private')}
        />
        <Radio
          label={t('invoice_type_company')}
          checked={f.invoiceType === 'company'}
          onChange={() => c.setField('invoiceType', 'company')}
        />
      </div>

      {!isCompany && isIT && (
        <Input label={t('form_codice_fiscale')} {...field('codiceFiscale')} />
      )}

      {isCompany && (
        <>
          <Input label={t('form_ragione_sociale')} {...field('ragioneSociale')} />
          {isIT ? (
            <>
              <Input label={t('form_partita_iva')} {...field('partitaIva')} />
              <Input label={t('form_sdi')} {...field('sdi')} />
              <Input label={t('form_pec')} type="email" {...field('pec')} />
            </>
          ) : (
            <Input label={t('form_vat_id')} {...field('vatId')} />
          )}
        </>
      )}
    </div>
  );
}

// ── Campi riutilizzabili ─────────────────────────────────────────────────────

function Input({
  label,
  error,
  type = 'text',
  value,
  onChange,
}: {
  label: string;
  error?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={`ui-input ${error ? 'ring-2 ring-brand-red' : ''}`}
      />
      {error && <span className="mt-1 block text-xs text-brand-red">{error}</span>}
    </label>
  );
}

function CountrySelect({
  label,
  value,
  onChange,
  tc,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  tc: (k: string) => string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ui-input"
      >
        {COUNTRY_CODES.map((code) => (
          <option key={code} value={code}>
            {tc(code.toLowerCase())}
          </option>
        ))}
      </select>
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-neutral-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded accent-brand-pink"
      />
      {label}
    </label>
  );
}

function Radio({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-neutral-700">
      <input type="radio" checked={checked} onChange={onChange} className="h-4 w-4 accent-brand-pink" />
      {label}
    </label>
  );
}
