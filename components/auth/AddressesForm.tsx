'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  type UserAddress,
  EMPTY_ADDRESS,
  loadAddresses,
  saveAddresses,
} from '@/lib/profile/firestore';

const FIELDS: (keyof UserAddress)[] = [
  'firstName', 'lastName', 'address', 'addressNotes',
  'postalCode', 'city', 'province', 'country', 'phone',
];

export function AddressesForm() {
  const t = useTranslations('addresses');
  const { user } = useAuth();

  const [shipping, setShipping] = useState<UserAddress>(EMPTY_ADDRESS);
  const [billing, setBilling] = useState<UserAddress>(EMPTY_ADDRESS);
  const [sameBilling, setSameBilling] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { shipping: s, billing: b } = await loadAddresses(user.uid);
      if (s) setShipping(s);
      if (b) {
        setBilling(b);
        setSameBilling(JSON.stringify(b) === JSON.stringify(s));
      }
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <p className="py-10 text-sm text-neutral-400">{t('loading')}</p>;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      await saveAddresses(user.uid, shipping, sameBilling ? undefined : billing);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-8">
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-neutral-900">{t('shipping')}</legend>
        <AddressFields value={shipping} onChange={setShipping} t={t} />
      </fieldset>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={sameBilling}
          onChange={(e) => setSameBilling(e.target.checked)}
          className="h-4 w-4 rounded border-neutral-300"
        />
        {t('same_as_shipping')}
      </label>

      {!sameBilling && (
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-neutral-900">{t('billing')}</legend>
          <AddressFields value={billing} onChange={setBilling} t={t} />
        </fieldset>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {t('save')}
        </button>
        {saved && <span className="text-sm text-emerald-700">{t('saved')}</span>}
      </div>
    </form>
  );
}

function AddressFields({
  value,
  onChange,
  t,
}: {
  value: UserAddress;
  onChange: (v: UserAddress) => void;
  t: (k: string) => string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {FIELDS.map((field) => (
        <input
          key={field}
          type={field === 'phone' ? 'tel' : 'text'}
          value={value[field]}
          onChange={(e) => onChange({ ...value, [field]: e.target.value })}
          placeholder={t(field)}
          className={`rounded-md border border-neutral-300 px-3 py-2 text-sm ${
            field === 'address' || field === 'addressNotes' ? 'sm:col-span-2' : ''
          }`}
        />
      ))}
    </div>
  );
}
