'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useMailingList } from '@/lib/hooks/useMailingList';
import { resizeToWebp } from '@/lib/admin/imageResize';

/**
 * Form "Supporto ordini" — replica fedele di `SupportFormWidget.dart`.
 * Invia alla Cloud Function `supportForm` (onRequest HTTP). Campi pill su fondo
 * crema (#FFF3CC), titolo/CTA in Genty rosa. Logica condizionale:
 *  - "Desidero effettuare un reso"   → mostra il motivo del reso
 *  - "Il prodotto è danneggiato"     → mostra l'upload foto (max 5)
 *  - "Non ho ricevuto la mail…"      → numero ordine NON obbligatorio
 */
const CLOUD_FN = 'https://supportform-3zu6hsjkpq-uc.a.run.app';
const PREFIXES = ['+39', '+1', '+44', '+33', '+34', '+49', '+41'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PHOTOS = 5;

const REASON_KEYS = [
  'reason_lost',
  'reason_return',
  'reason_damaged',
  'reason_modify',
  'reason_no_email',
  'reason_special',
  'reason_other',
] as const;

const RETURN_REASON_KEYS = [
  'return_reason_damaged',
  'return_reason_wrong',
  'return_reason_other',
] as const;

const RETURN_TRIGGER = 'reason_return';
const NO_CONFIRM_TRIGGER = 'reason_no_email';
const DAMAGED_TRIGGER = 'reason_damaged';

const PILL =
  'w-full rounded-full border-0 bg-brand-cream px-6 py-[14px] text-[15px] text-ink outline-none ring-brand-pink/50 transition placeholder:text-[#b9a86a] focus:ring-2';

interface Photo {
  filename: string;
  /** Estensione effettiva dopo la ricompressione (webp, o quella originale). */
  ext: string;
  dataUrl: string;
  base64: string;
}

export function SupportForm() {
  const t = useTranslations('support');
  const tf = useTranslations('contactForm');
  const { addEmail } = useMailingList();

  const [f, setF] = useState({
    name: '',
    lastName: '',
    email: '',
    emailConfirm: '',
    orderNumber: '',
    phone: '',
    message: '',
  });
  const [prefix, setPrefix] = useState('+39');
  const [reason, setReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF((s) => ({ ...s, [k]: e.target.value }));

  const orderNumberRequired = reason !== NO_CONFIRM_TRIGGER;
  const showReturnReason = reason === RETURN_TRIGGER;
  const showPhotoUpload = reason === DAMAGED_TRIGGER;

  function onReasonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setReason(v);
    if (v !== RETURN_TRIGGER) setReturnReason('');
    if (v !== DAMAGED_TRIGGER) setPhotos([]);
  }

  async function onPickPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // consente di riselezionare lo stesso file
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;

    const picked = await Promise.all(
      files.slice(0, remaining).map(async (file): Promise<Photo | null> => {
        // Ricomprimi PRIMA dell'invio (come `imageQuality: 60` del picker
        // Flutter): le foto originali da telefono sono 3–8 MB l'una e in
        // base64 gonfiano il payload oltre i limiti della Cloud Function
        // → 500. A 1280px in WebP una foto pesa ~100–300 KB.
        const { blob, isWebp } = await resizeToWebp(file, 1280);
        const ext = isWebp
          ? 'webp'
          : file.name.includes('.')
            ? file.name.split('.').pop()!.toLowerCase()
            : 'jpg';
        return new Promise<Photo | null>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = String(reader.result ?? '');
            const comma = dataUrl.indexOf(',');
            if (comma === -1) return resolve(null);
            resolve({
              filename: file.name,
              ext,
              dataUrl,
              base64: dataUrl.slice(comma + 1),
            });
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      }),
    );
    const valid = picked.filter((p): p is Photo => p !== null);
    if (valid.length) setPhotos((s) => [...s, ...valid].slice(0, MAX_PHOTOS));
  }

  function validate(): boolean {
    const er: Record<string, string> = {};
    if (!f.name.trim()) er.name = tf('form_err_name');

    if (!f.email.trim()) er.email = tf('form_err_email_empty');
    else if (!EMAIL_RE.test(f.email.trim())) er.email = tf('form_err_email_invalid');

    if (!f.emailConfirm.trim()) er.emailConfirm = t('err_email_confirm');
    else if (f.emailConfirm.trim().toLowerCase() !== f.email.trim().toLowerCase())
      er.emailConfirm = tf('form_err_email_mismatch');

    if (orderNumberRequired && !f.orderNumber.trim()) er.orderNumber = t('err_order');
    if (!reason) er.reason = t('err_reason');

    setErrors(er);
    return Object.keys(er).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (!validate()) {
      setStatus({ ok: false, text: tf('form_err_required') });
      return;
    }
    setSending(true);
    try {
      const payload: Record<string, unknown> = {
        name: f.name.trim(),
        lastName: f.lastName.trim(),
        email: f.email.trim(),
        orderNumber: f.orderNumber.trim(),
        phone: f.phone.trim() ? `${prefix} ${f.phone.trim()}` : '',
        reason: t(reason),
        message: f.message.trim(),
      };
      if (showReturnReason && returnReason) payload.returnReason = t(returnReason);
      if (showPhotoUpload && photos.length > 0) {
        payload.attachments = photos.map((p, i) => ({
          filename: `foto_${i + 1}.${p.ext}`,
          content: p.base64,
        }));
      }

      const resp = await fetch(CLOUD_FN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        // Best-effort mailing list (gated dal consenso marketing), come Flutter.
        void addEmail(f.email, 'support_form');
        setStatus({ ok: true, text: tf('form_success') });
        setF({
          name: '', lastName: '', email: '', emailConfirm: '',
          orderNumber: '', phone: '', message: '',
        });
        setReason('');
        setReturnReason('');
        setPhotos([]);
        setErrors({});
      } else {
        setStatus({ ok: false, text: tf('form_err_send', { code: String(resp.status) }) });
      }
    } catch {
      setStatus({ ok: false, text: tf('form_err_network') });
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mx-auto w-full max-w-[720px] rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] desk:p-7"
    >
      <h1 className="font-special text-[48px] leading-none text-brand-pink desk:text-[80px]">
        {t('form_title')}
      </h1>
      <p className="mt-2 font-body text-[15px] leading-[1.65] text-brand-pink desk:text-[22px]">
        {t('form_subtitle')}
      </p>

      <div className="mt-5 flex flex-col gap-3.5">
        {/* Nome + Cognome */}
        <Row>
          <Field value={f.name} onChange={set('name')} placeholder={tf('form_name_label')} error={errors.name} />
          <Field value={f.lastName} onChange={set('lastName')} placeholder={tf('form_last_name')} />
        </Row>

        {/* Email + Conferma email */}
        <Row>
          <Field type="email" value={f.email} onChange={set('email')} placeholder={tf('form_email_label')} error={errors.email} />
          <Field type="email" value={f.emailConfirm} onChange={set('emailConfirm')} placeholder={t('form_email_confirm_label')} error={errors.emailConfirm} />
        </Row>

        {/* Numero ordine + Telefono */}
        <Row>
          <Field
            value={f.orderNumber}
            onChange={set('orderNumber')}
            placeholder={orderNumberRequired ? t('form_order_label') : t('form_order_label_optional')}
            error={errors.orderNumber}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 rounded-full bg-brand-cream px-3 py-[14px]">
              <select
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="border-0 bg-transparent pl-2 text-[15px] text-ink outline-none"
                aria-label="Prefisso"
              >
                {PREFIXES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input
                type="tel"
                value={f.phone}
                onChange={set('phone')}
                placeholder={tf('form_phone_label')}
                className="w-full border-0 bg-transparent pr-3 text-[15px] text-ink outline-none placeholder:text-[#b9a86a]"
              />
            </div>
          </div>
        </Row>

        {/* Motivo contatto */}
        <div>
          <Select value={reason} onChange={onReasonChange} placeholder={t('form_reason_hint')}>
            {REASON_KEYS.map((k) => (
              <option key={k} value={k}>{t(k)}</option>
            ))}
          </Select>
          <FieldError error={errors.reason} />
        </div>

        {/* Motivo del reso (condizionale) */}
        {showReturnReason && (
          <Select
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            placeholder={t('form_return_reason_hint')}
          >
            {RETURN_REASON_KEYS.map((k) => (
              <option key={k} value={k}>{t(k)}</option>
            ))}
          </Select>
        )}

        {/* Foto del danno (condizionale) */}
        {showPhotoUpload && (
          <div>
            <p className="mb-2 pl-1 text-[13px] font-semibold text-brand-pink">
              {t('form_photo_label')}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {photos.map((p, i) => (
                <div key={`${p.filename}-${i}`} className="relative h-[72px] w-[72px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.dataUrl}
                    alt=""
                    className="h-[72px] w-[72px] rounded-[10px] object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotos((s) => s.filter((_, idx) => idx !== i))}
                    aria-label="Rimuovi"
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-pink text-white"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="flex h-[72px] w-[72px] cursor-pointer flex-col items-center justify-center rounded-[10px] border-[1.5px] border-brand-pink/40 bg-brand-cream text-brand-pink">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M3 8.5A1.5 1.5 0 014.5 7h2l1-2h5l1 2h2A1.5 1.5 0 0118 8.5V17a2 2 0 01-2 2H5a2 2 0 01-2-2V8.5z" stroke="currentColor" strokeWidth="1.6" />
                    <circle cx="10.5" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                  <span className="mt-0.5 text-[9px]">{t('form_photo_add')}</span>
                  <input type="file" accept="image/*" multiple onChange={onPickPhotos} className="hidden" />
                </label>
              )}
            </div>
            <p className="mt-1.5 text-[11px] text-neutral-500">{t('form_photo_max')}</p>
          </div>
        )}

        {/* Messaggio */}
        <textarea
          value={f.message}
          onChange={set('message')}
          placeholder={t('form_message_hint')}
          rows={6}
          className="w-full resize-y rounded-[20px] border-0 bg-brand-cream px-6 py-4 text-[15px] text-ink outline-none ring-brand-pink/50 transition placeholder:text-[#b9a86a] focus:ring-2"
        />
      </div>

      {status && (
        <div
          className={`mt-4 flex items-center gap-2.5 rounded-xl border p-3 text-sm ${
            status.ok
              ? 'border-green-300 bg-green-50 text-green-800'
              : 'border-red-300 bg-red-50 text-red-800'
          }`}
          role="status"
        >
          <span>{status.ok ? '✓' : '⚠'}</span>
          <span className="whitespace-pre-line">{status.text}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={sending}
        className="cta-bounce mt-4 w-full rounded-full bg-brand-pink py-3.5 font-special text-[28px] text-brand-cream2 enabled:desk:hover:shadow-pink-cta disabled:opacity-70"
      >
        {sending ? '…' : t('form_submit')}
      </button>

      {/* Nota legale */}
      <p className="mt-3 text-center text-xs leading-relaxed text-[#8E8E93]">
        {tf('form_legal_pre')}
        <Link href="/terms-of-service" className="underline">{tf('form_legal_terms')}</Link>
        {tf('form_legal_mid')}
        <Link href="/cookie-policy" className="underline">{tf('form_legal_privacy')}</Link>
        {tf('form_legal_post')}
      </p>
    </form>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  // Colonna singola sotto i 900px (requisito mobile), due colonne da `desk` in su.
  return <div className="flex flex-col gap-3.5 desk:flex-row desk:gap-3.5">{children}</div>;
}

function Field({
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div className="flex-1">
      <input {...props} className={PILL} />
      <FieldError error={error} />
    </div>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`${PILL} appearance-none bg-[length:18px] bg-[right_1.25rem_center] bg-no-repeat ${value ? 'text-ink' : 'text-[#b9a86a]'}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%23ee67ab' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>\")",
      }}
    >
      <option value="" disabled>{placeholder}</option>
      {children}
    </select>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mt-1 pl-5 text-xs text-brand-red">{error}</p>;
}
