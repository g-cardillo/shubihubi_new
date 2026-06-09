'use client';

import { useEffect, useState } from 'react';
import {
  createGiftCard,
  deleteGiftCard,
  streamGiftCards,
} from '@/lib/admin/repository';
import type { GiftCardDoc } from '@/lib/admin/types';

/**
 * Gestione buoni / gift card (replica `GiftCardsTab` di Flutter): form di
 * creazione (codice, importo €) + lista realtime con eliminazione. Crea via
 * Cloud Function `adminCreateGiftCard`, elimina via Firestore.
 */
export function GiftCardsTab() {
  const [cards, setCards] = useState<GiftCardDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    return streamGiftCards(setCards, (e) => setError(e.message));
  }, []);

  async function save() {
    const c = code.trim().toUpperCase();
    const a = Number(amount.trim().replace(',', '.'));

    if (!c) return setFormError('Codice obbligatorio');
    if (!Number.isFinite(a) || a <= 0) return setFormError('Importo non valido');

    setFormError(null);
    setSaving(true);
    try {
      await createGiftCard({ code: c, amountEur: a });
      setCode('');
      setAmount('');
    } catch (e) {
      setFormError(`Errore: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(`Eliminare il buono "${id}"?`)) return;
    try {
      await deleteGiftCard(id);
    } catch (e) {
      window.alert(`Errore: ${(e as Error).message}`);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-900">Buoni / Note di credito</h2>

      {/* Form creazione */}
      <div className="mt-4 flex flex-wrap items-end gap-3 border-b border-neutral-200 pb-6">
        <Field label="Codice buono" width="w-44">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="es. BUONO50"
            className="admin-input uppercase"
          />
        </Field>
        <Field label="Importo (€)" width="w-40">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="es. 50"
            className="admin-input"
          />
        </Field>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="h-[42px] rounded-md bg-brand-pink px-5 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-50"
        >
          {saving ? '…' : '+ Crea buono'}
        </button>
        {formError && <p className="w-full text-sm text-brand-red">{formError}</p>}
      </div>

      {/* Lista */}
      <div className="mt-4">
        {error && <p className="text-sm text-brand-red">Errore nel caricamento: {error}</p>}
        {!error && cards === null && (
          <p className="text-sm text-neutral-400">Caricamento…</p>
        )}
        {cards && cards.length === 0 && (
          <p className="text-sm text-neutral-500">Nessun buono creato.</p>
        )}
        {cards && cards.length > 0 && (
          <ul className="divide-y divide-neutral-100">
            {cards.map((d) => {
              const active = d.active !== false;
              const amountEur = (Number(d.amountCents ?? 0)) / 100;
              const meta = [
                `€${amountEur.toFixed(2)}`,
                active ? null : 'Già usato',
              ].filter(Boolean).join('  •  ');
              return (
                <li key={d.id} className="flex items-center gap-3 py-3">
                  <span className={active ? 'text-emerald-600' : 'text-neutral-400'}>
                    {active ? '🎁' : '✓'}
                  </span>
                  <div className="flex-1">
                    <p className={`font-semibold ${active ? 'text-neutral-900' : 'text-neutral-400 line-through'}`}>
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
