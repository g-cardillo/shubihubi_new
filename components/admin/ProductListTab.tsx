'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { adminDeleteProduct, streamProducts } from '@/lib/admin/repository';
import type { AdminProduct } from '@/lib/admin/types';

/**
 * Elenco prodotti in realtime (replica `_ProductListTab` / `_ProductRow`):
 * miniatura, titolo, prezzo, badge saldo/sold-out e azioni
 * duplica / modifica / elimina. L'eliminazione passa per `adminDeleteProduct`
 * (rimuove anche le immagini su Storage lato Function).
 */
export function ProductListTab({
  onEdit,
  onDuplicate,
}: {
  onEdit: (p: AdminProduct) => void;
  onDuplicate: (p: AdminProduct) => void;
}) {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    return streamProducts(setProducts);
  }, []);

  async function remove(p: AdminProduct) {
    if (
      !window.confirm(
        "Eliminare il prodotto? L'operazione elimina anche le immagini su Storage.",
      )
    )
      return;
    setDeletingId(p.id);
    try {
      await adminDeleteProduct(p.id);
    } catch (e) {
      window.alert(`Errore: ${(e as Error).message}`);
    } finally {
      setDeletingId(null);
    }
  }

  if (products === null) {
    return <p className="text-sm text-neutral-400">Caricamento…</p>;
  }
  if (products.length === 0) {
    return <p className="text-sm text-neutral-500">Nessun prodotto trovato.</p>;
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {products.map((p) => {
        const title = p.title_it || p.title || '-';
        const images = p.imageUrls ?? [];
        return (
          <li key={p.id} className="flex items-center gap-3 py-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
              {images[0] ? (
                <Image src={images[0]} alt={title} fill sizes="56px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-neutral-300">
                  🖼
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-neutral-900">{title}</p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500">
                <span>€ {p.price ?? '-'}</span>
                {p.isOnSale && <Badge text="SALDO" tone="amber" />}
                {p.isSoldOut && <Badge text="SOLD OUT" tone="rose" />}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <IconBtn title="Duplica" onClick={() => onDuplicate(p)}>⧉</IconBtn>
              <IconBtn title="Modifica" onClick={() => onEdit(p)}>✎</IconBtn>
              <IconBtn
                title="Elimina"
                onClick={() => remove(p)}
                disabled={deletingId === p.id}
                danger
              >
                {deletingId === p.id ? '…' : '🗑'}
              </IconBtn>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Badge({ text, tone }: { text: string; tone: 'amber' | 'rose' }) {
  const cls =
    tone === 'amber'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-brand-red/10 text-brand-red';
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${cls}`}>
      {text}
    </span>
  );
}

function IconBtn({
  title,
  onClick,
  disabled,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-md hover:bg-neutral-100 disabled:opacity-40 ${
        danger ? 'text-brand-red' : 'text-neutral-600'
      }`}
    >
      {children}
    </button>
  );
}
