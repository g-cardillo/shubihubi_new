'use client';

/**
 * Indirizzi utente lato client (lettura/scrittura su users/{uid}).
 * Replica `loadAddresses`/`saveAddresses` di `AuthRepositoryImpl` (Flutter).
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export interface UserAddress {
  firstName: string;
  lastName: string;
  address: string;
  addressNotes: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  phone: string;
}

export const EMPTY_ADDRESS: UserAddress = {
  firstName: '', lastName: '', address: '', addressNotes: '',
  postalCode: '', city: '', province: '', country: 'IT', phone: '',
};

function fromMap(m: Record<string, unknown> | undefined): UserAddress | null {
  if (!m) return null;
  return {
    firstName: (m.firstName as string) ?? '',
    lastName: (m.lastName as string) ?? '',
    address: (m.address as string) ?? '',
    addressNotes: (m.addressNotes as string) ?? '',
    postalCode: (m.postalCode as string) ?? '',
    city: (m.city as string) ?? '',
    province: (m.province as string) ?? '',
    country: (m.country as string) ?? 'IT',
    phone: (m.phone as string) ?? '',
  };
}

export async function loadAddresses(
  uid: string,
): Promise<{ shipping: UserAddress | null; billing: UserAddress | null }> {
  const snap = await getDoc(doc(db, 'users', uid));
  const data = snap.data();
  return {
    shipping: fromMap(data?.shippingAddress),
    billing: fromMap(data?.billingAddress),
  };
}

export async function saveAddresses(
  uid: string,
  shipping: UserAddress,
  billing?: UserAddress,
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    { shippingAddress: shipping, billingAddress: billing ?? shipping },
    { merge: true },
  );
}
