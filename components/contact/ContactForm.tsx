'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useMailingList } from '@/lib/hooks/useMailingList';

const CLOUD_FN = 'https://us-central1-shubihubi.cloudfunctions.net/contactForm';
const PREFIXES = ['+39', '+1', '+44', '+33', '+34', '+49', '+41'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pill input rosa chiaro (#FFD4D9), bordi arrotondati — replica `_Field`.
 * `float-control` + placeholder " " abilitano la floating label (vedi
 * `.float-label` in globals.css): l'etichetta riposa dentro al campo in grigio
 * scuro e sale sul bordo alto al focus / a campo compilato, come il
 * `TextFormField` Material del Flutter.
 */
const PILL =
  'float-control w-full rounded-full border-0 bg-brand-pinkLight px-6 py-[14px] text-[15px] text-ink outline-none ring-brand-pink/50 transition placeholder:text-transparent focus:ring-2';

/**
 * Form "Scrivimi" della pagina Contatti (replica `ContactFormWidget`).
 * Invia alla Cloud Function `contactForm`. Validazione e payload identici al
 * Flutter; campi pill rosa, bottone pill rosa con label Genty crema.
 */
export function ContactForm() {
  const t = useTranslations('contactForm');
  const { addEmail } = useMailingList();

  const [f, setF] = useState({
    name: '',
    lastName: '',
    email: '',
    emailConfirm: '',
    yourLocation: '',
    phone: '',
    date: '',
    eventLocation: '',
    eventType: '',
    guestsNumber: '',
    serviceType: '',
    message: '',
  });
  const [prefix, setPrefix] = useState('+39');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  function validate(): boolean {
    const er: Record<string, string> = {};
    if (!f.name.trim()) er.name = t('form_err_name');
    if (!f.email.trim()) er.email = t('form_err_email_empty');
    else if (!EMAIL_RE.test(f.email.trim())) er.email = t('form_err_email_invalid');
    if (!f.emailConfirm.trim()) er.emailConfirm = t('form_err_email_empty');
    else if (f.emailConfirm.trim().toLowerCase() !== f.email.trim().toLowerCase())
      er.emailConfirm = t('form_err_email_mismatch');
    if (!f.yourLocation.trim()) er.yourLocation = t('form_err_location');
    if (!f.date.trim()) er.date = t('form_err_date');
    if (!f.eventLocation.trim()) er.eventLocation = t('form_err_event_location');
    if (!f.eventType.trim()) er.eventType = t('form_err_event_type');
    if (!f.guestsNumber.trim()) er.guestsNumber = t('form_err_guests_empty');
    else if (!(Number(f.guestsNumber) > 0)) er.guestsNumber = t('form_err_guests_invalid');
    if (!f.serviceType.trim()) er.serviceType = t('form_err_service');
    if (!f.message.trim()) er.message = t('form_err_message_empty');
    else if (f.message.trim().length < 10) er.message = t('form_err_message_short');
    setErrors(er);
    return Object.keys(er).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (!validate()) {
      setStatus({ ok: false, text: t('form_err_required') });
      return;
    }
    setSending(true);
    try {
      // Data gg/mm/aa come nel Flutter (input nativo: yyyy-mm-dd).
      const [yy, mm, dd] = f.date.split('-');
      const dateFmt = dd && mm && yy ? `${dd}/${mm}/${yy.slice(2)}` : f.date;
      const payload = {
        name: f.name.trim(),
        lastName: f.lastName.trim(),
        email: f.email.trim(),
        phone: f.phone.trim() ? `${prefix} ${f.phone.trim()}` : '',
        message: f.message.trim(),
        date: dateFmt,
        eventType: f.eventType.trim(),
        yourLocation: f.yourLocation.trim(),
        eventLocation: f.eventLocation.trim(),
        guestsNumber: f.guestsNumber.trim(),
        serviceType: f.serviceType.trim(),
      };
      const resp = await fetch(CLOUD_FN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        // Best-effort: aggiunge l'email alla mailing list (gated dal consenso
        // marketing), come `MailingListService` del Flutter.
        void addEmail(f.email, 'contact_form');
        setStatus({ ok: true, text: t('form_success') });
        setF({
          name: '', lastName: '', email: '', emailConfirm: '', yourLocation: '',
          phone: '', date: '', eventLocation: '', eventType: '', guestsNumber: '',
          serviceType: '', message: '',
        });
        setErrors({});
      } else {
        setStatus({ ok: false, text: t('form_err_send', { code: String(resp.status) }) });
      }
    } catch {
      setStatus({ ok: false, text: t('form_err_network') });
    } finally {
      setSending(false);
    }
  }

  const today = new Date();
  const min = today.toISOString().slice(0, 10);
  const max = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate())
    .toISOString()
    .slice(0, 10);

  const services = [
    t('service_live_painting'),
    t('service_stationery'),
    t('service_tamburelli'),
    t('service_bomboniere'),
    t('service_other'),
  ];

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto w-full max-w-[720px]">
      <h1 className="text-center font-special text-[48px] leading-none text-brand-red desk:text-[80px]">
        {t('form_write_me')}
      </h1>
      <p className="mt-2 text-center font-body text-[15px] leading-relaxed text-brand-pink desk:text-[22px]">
        {t('form_fill_desc')}
      </p>

      <div className="mt-5 flex flex-col gap-3.5">
        <Row>
          <Field name="name" value={f.name} onChange={set('name')} label={t('form_name_label')} error={errors.name} />
          <Field name="lastName" value={f.lastName} onChange={set('lastName')} label={t('lastname_label')} />
        </Row>
        <Row>
          <Field name="email" type="email" value={f.email} onChange={set('email')} label={t('form_email_label')} error={errors.email} />
          <Field name="emailConfirm" type="email" value={f.emailConfirm} onChange={set('emailConfirm')} label={`${t('form_email_confirm')} *`} error={errors.emailConfirm} />
        </Row>
        <Row>
          <Field name="yourLocation" value={f.yourLocation} onChange={set('yourLocation')} label={t('form_location_label')} error={errors.yourLocation} />
          {/* Telefono con prefisso */}
          <div className="flex-1">
            <div className="relative flex items-center gap-2 rounded-full bg-brand-pinkLight px-3 py-[14px]">
              <select
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="relative z-10 border-0 bg-transparent pl-2 text-[15px] text-ink outline-none"
                aria-label="Prefisso"
              >
                {PREFIXES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <div className="relative flex-1">
                <input
                  type="tel"
                  value={f.phone}
                  onChange={set('phone')}
                  placeholder=" "
                  className="float-control w-full border-0 bg-transparent pr-3 text-[15px] text-ink outline-none placeholder:text-transparent"
                />
                <span className="float-label float-label--phone">{t('form_phone_label')}</span>
              </div>
            </div>
          </div>
        </Row>
        <Row>
          <DateField min={min} max={max} value={f.date} onChange={set('date')} label={t('form_event_date_label')} error={errors.date} />
          <Field name="eventLocation" value={f.eventLocation} onChange={set('eventLocation')} label={t('form_event_location_label')} error={errors.eventLocation} />
        </Row>
        <Row>
          <Field name="eventType" value={f.eventType} onChange={set('eventType')} label={t('form_event_type_label')} error={errors.eventType} />
          <Field name="guestsNumber" type="number" value={f.guestsNumber} onChange={set('guestsNumber')} label={t('form_guests_label')} error={errors.guestsNumber} />
        </Row>

        {/* Servizio (dropdown) */}
        <div>
          <div className="relative">
            <select
              value={f.serviceType}
              onChange={set('serviceType')}
              className={`${PILL} appearance-none bg-[length:18px] bg-[right_1.25rem_center] bg-no-repeat text-ink ${f.serviceType ? 'float-up' : ''}`}
              style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%23ee67ab' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>\")" }}
            >
              <option value="" disabled />
              {services.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="float-label">{t('form_service_label')}</span>
          </div>
          <FieldError error={errors.serviceType} />
        </div>

        {/* Messaggio */}
        <div>
          <div className="relative">
            <textarea
              value={f.message}
              onChange={set('message')}
              placeholder=" "
              rows={5}
              className="float-control w-full resize-y rounded-[20px] border-0 bg-brand-pinkLight px-6 py-4 text-[15px] text-ink outline-none ring-brand-pink/50 transition placeholder:text-transparent focus:ring-2"
            />
            <span className="float-label float-label--area">{t('form_message_label')}</span>
          </div>
          <FieldError error={errors.message} />
        </div>
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
          <span>{status.text}</span>
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
        {t('form_legal_pre')}
        <Link href="/terms-of-service" className="underline">{t('form_legal_terms')}</Link>
        {t('form_legal_mid')}
        <Link href="/cookie-policy" className="underline">{t('form_legal_privacy')}</Link>
        {t('form_legal_post')}
      </p>
    </form>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3.5 tablet:flex-row tablet:gap-3.5">{children}</div>;
}

function Field({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <div className="flex-1">
      <div className="relative">
        <input {...props} placeholder=" " className={PILL} />
        <span className="float-label">{label}</span>
      </div>
      <FieldError error={error} />
    </div>
  );
}

/**
 * Campo data che si comporta come gli altri pill: mostra il placeholder o la
 * data formattata (gg/mm/aaaa), niente UI nativa visibile. Al click apre il
 * calendario nativo (`showPicker`), così la scelta avviene SOLO dal menu — su
 * mobile il layout resta identico agli altri input.
 */
function DateField({
  min,
  max,
  value,
  onChange,
  label,
  error,
}: {
  min: string;
  max: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  error?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const open = () => {
    const el = ref.current;
    if (!el) return;
    // showPicker apre il calendario senza mostrare il campo nativo; fallback al
    // focus per i browser che non lo supportano.
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
  };

  // yyyy-mm-dd → dd/mm/yyyy; vuoto quando non selezionata (la floating label
  // resta dentro al campo finché non c'è un valore).
  const display = value ? value.split('-').reverse().join('/') : '';

  return (
    <div className="flex-1">
      <div className="relative">
        <button
          type="button"
          onClick={open}
          className={`${PILL} flex items-center justify-between text-left ${value ? 'float-up' : ''}`}
        >
          <span className="text-ink">{display}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="4.5" width="18" height="16" rx="2.5" stroke="#ee67ab" strokeWidth="1.6" />
            <path d="M3 9h18M8 3v3M16 3v3" stroke="#ee67ab" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <span className="float-label">{label}</span>
        {/* Input reale: invisibile, copre il pill per ricevere il click e mostrare
            il picker; gestisce anche il cambio valore. */}
        <input
          ref={ref}
          type="date"
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          onClick={(e) => {
            e.preventDefault();
            open();
          }}
          aria-label={label}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      <FieldError error={error} />
    </div>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mt-1 pl-5 text-xs text-brand-red">{error}</p>;
}
