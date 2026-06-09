'use client';

import { useState } from 'react';
import { ProductListTab } from './ProductListTab';
import { ProductForm, type FormMode } from './ProductForm';
import { DiscountCodesTab } from './DiscountCodesTab';
import { GiftCardsTab } from './GiftCardsTab';
import type { AdminProduct } from '@/lib/admin/types';

/**
 * Shell del pannello admin (replica `_AdminShell` + NavigationRail di Flutter):
 * navigazione laterale a tab e contenuto corrente. Tab: Prodotti, Aggiungi/
 * Modifica (form), Sconti, Buoni.
 *
 * Lo stato del form (mode + prodotto iniziale) vive qui: avviare add/edit/
 * duplicate rimonta `ProductForm` con una `key` nuova per re-inizializzarlo.
 */
type Tab = 'products' | 'form' | 'discounts' | 'giftcards';

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: 'products', label: 'Prodotti', icon: '📦' },
  { id: 'form', label: 'Aggiungi', icon: '＋' },
  { id: 'discounts', label: 'Sconti', icon: '🏷' },
  { id: 'giftcards', label: 'Buoni', icon: '🎁' },
];

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('products');

  // Stato del form prodotto.
  const [formMode, setFormMode] = useState<FormMode>('add');
  const [formInitial, setFormInitial] = useState<AdminProduct | null>(null);
  const [formKey, setFormKey] = useState(0);

  function startForm(mode: FormMode, initial: AdminProduct | null) {
    setFormMode(mode);
    setFormInitial(initial);
    setFormKey((k) => k + 1);
    setTab('form');
  }

  function onNav(id: Tab) {
    // Il tab "Aggiungi" avvia sempre un form vuoto.
    if (id === 'form') startForm('add', null);
    else setTab(id);
  }

  return (
    <div className="flex min-h-[70vh] gap-6">
      {/* Navigazione laterale */}
      <nav className="flex w-24 shrink-0 flex-col gap-1 sm:w-36">
        {NAV.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNav(item.id)}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-medium transition sm:flex-row sm:justify-start sm:gap-3 sm:px-4 sm:text-sm ${
                active
                  ? 'bg-brand-pink text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Contenuto */}
      <section className="min-w-0 flex-1">
        {tab === 'products' && (
          <ProductListTab
            onEdit={(p) => startForm('edit', p)}
            onDuplicate={(p) => startForm('duplicate', p)}
          />
        )}
        {tab === 'form' && (
          <ProductForm
            key={formKey}
            mode={formMode}
            initial={formInitial}
            onDone={() => setTab('products')}
          />
        )}
        {tab === 'discounts' && <DiscountCodesTab />}
        {tab === 'giftcards' && <GiftCardsTab />}
      </section>
    </div>
  );
}
