import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const locales = ['en', 'de', 'it'] as const;
export const defaultLocale = 'en' as const;
export type Locale = (typeof locales)[number];

export const localeConfig = [
  { code: 'en', nativeName: 'EN', imgcode: 'GB' },
  { code: 'de', nativeName: 'DE', imgcode: 'DE' },
  { code: 'it', nativeName: 'IT', imgcode: 'IT' }
] as const;

export const routes = {
  home: '/',
  osttirol: '/osttirol',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  account: '/account',
  contact: '/contact',
  faq: '/faq'
} as const;

export const routing = defineRouting({
  locales,
  defaultLocale,
  localeDetection: false
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
