'use client';

import { useEffect, useState } from 'react';
import {
  createDiscountCode,
  deleteDiscountCode,
  functionErrorMessage,
  streamDiscountCodes,
} from '@/lib/admin/repository';
import type { DiscountCodeDoc } from '@/lib/admin/types';

/**
 * Gestione codici sconto (replica `DiscountCodesTab` di Flutter): form di
 * creazione (codice, sconto %, minimo ordine opzionale) + lista realtime con
 * eliminazione. Crea via Cloud Function `adminCreateDiscountCode`, elimina via
 * Firestore.
 */
export function DiscountCodesTab() {
  const [codes, setCodes] = useState<DiscountCodeDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [percent, setPercent] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    return streamDiscountCodes(setCodes, (e) => setError(e.message));
  }, []);

  async function save() {
    const c = code.trim().toUpperCase();
    const p = Number(percent.trim());
    const minRaw = minAmount.trim();
    const min = minRaw === '' ? undefined : Number(minRaw.replace(',', '.'));

    if (!c) return setFormError('Codice obbligatorio');
    if (!Number.isFinite(p) || p <= 0 || p > 100)
      return setFormError('Sconto % deve essere 1–100');
    if (min != null && (!Number.isFinite(min) || min < 0))
      return setFormError('Minimo ordine non valido');

    setFormError(null);
    setSaving(true);
    try {
      await createDiscountCode({ code: c, discountPercent: p, minOrderAmount: min });
      setCode('');
      setPercent('');
      setMinAmount('');
    } catch (e) {
      setFormError(`Errore: ${functionErrorMessage(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(`Eliminare il codice "${id}"?`)) return;
    try {
      await deleteDiscountCode(id);
    } catch (e) {
      window.alert(`Errore: ${(e as Error).message}`);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-900">Codici sconto</h2>

      {/* Form creazione */}
      <div className="mt-4 flex flex-wrap items-end gap-3 border-b border-neutral-200 pb-6">
        <Field label="Codice" width="w-44">
          <input
            value={code}
            onChange={(e) =>
              // Il codice diventa l'ID documento Firestore: solo A-Z 0-9 _ -
              // (niente '/', spazi o simboli, che lo renderebbero invalido).
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))
            }
            placeholder="es. SUMMER20"
            className="admin-input uppercase"
          />
        </Field>
        <Field label="Sconto %" width="w-32">
          <input
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            inputMode="decimal"
            placeholder="es. 20"
            className="admin-input"
          />
        </Field>
        <Field label="Minimo ordine (€)" width="w-40">
          <input
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            inputMode="decimal"
            placeholder="opzionale"
            className="admin-input"
          />
        </Field>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="h-[42px] rounded-md bg-brand-pink px-5 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-50"
        >
          {saving ? '…' : '+ Crea codice'}
        </button>
        {formError && <p className="w-full text-sm text-brand-red">{formError}</p>}
      </div>

      {/* Lista */}
      <div className="mt-4">
        {error && <p className="text-sm text-brand-red">Errore nel caricamento: {error}</p>}
        {!error && codes === null && (
          <p className="text-sm text-neutral-400">Caricamento…</p>
        )}
        {codes && codes.length === 0 && (
          <p className="text-sm text-neutral-500">Nessun codice sconto creato.</p>
        )}
        {codes && codes.length > 0 && (
          <ul className="divide-y divide-neutral-100">
            {codes.map((d) => {
              const used = d.used === true;
              const pct = Number(d.discountPercent ?? 0);
              const min = d.minOrderAmount != null ? Number(d.minOrderAmount) : null;
              const meta = [
                `−${pct.toFixed(0)}%`,
                min != null && min > 0 ? `min. €${min.toFixed(2)}` : null,
                used ? 'Già usato' : null,
              ].filter(Boolean).join('  •  ');
              return (
                <li key={d.id} className="flex items-center gap-3 py-3">
                  <span className={used ? 'text-neutral-400' : 'text-emerald-600'}>
                    {used ? '✓' : '🏷'}
                  </span>
                  <div className="flex-1">
                    <p className={`font-semibold ${used ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>
                      {d.id}
                    </p>
                    <p className="text-xs text-neutral-500">{meta}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(d.id)}
                    title="Elimina"
                    className="text-brand-red hover:text-brand-red"
                  >
                    🗑
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  width,
  children,
}: {
  label: string;
  width: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${width}`}>
      <span className="mb-1 block text-xs font-medium text-neutral-600">{label}</span>
      {children}
    </label>
  );
}
