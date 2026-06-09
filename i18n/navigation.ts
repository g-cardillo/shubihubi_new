import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Wrapper di navigazione locale-aware: Link/redirect/usePathname/useRouter
// che aggiungono automaticamente il prefisso /it o /en.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
