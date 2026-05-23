import type { AstroCookies } from 'astro';
import { DEFAULT_LOCALE, LOCALE_COOKIE, SPANISH_SPEAKING_COUNTRIES } from './config';
import es from './locales/es';
import type { Locale, TranslationKey, Translations } from './types';
import { COUNTRY_BY_CODE, SECTION_LABELS } from '../data/album-structure';

export type { Locale, TranslationKey, Translations };
export { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, SPANISH_SPEAKING_COUNTRIES, DEFAULT_LOCALE } from './config';

function getNestedValue(obj: Translations, key: string): string | undefined {
  const parts = key.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

function applyParams(value: string, params?: Record<string, string | number>): string {
  if (!params) return value;
  let result = value;
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return result;
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'es';
}

export function detectLocale(country: string | null, acceptLanguage: string | null): Locale {
  if (country && SPANISH_SPEAKING_COUNTRIES.has(country.toUpperCase())) {
    return 'es';
  }
  if (acceptLanguage) {
    const primary = acceptLanguage.split(',')[0]?.trim().toLowerCase();
    if (primary?.startsWith('es')) return 'es';
  }
  return DEFAULT_LOCALE;
}

export function getLocaleFromRequest(request: Request, cookies: AstroCookies): Locale {
  const stored = cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(stored)) return stored;

  const country = request.headers.get('x-vercel-ip-country');
  const acceptLanguage = request.headers.get('accept-language');
  return detectLocale(country, acceptLanguage);
}

/** Returns Spanish translation when locale is es; otherwise the original English string. */
export function tr(
  locale: Locale,
  key: TranslationKey,
  en: string,
  params?: Record<string, string | number>,
): string {
  if (locale !== 'es') return applyParams(en, params);
  const value = getNestedValue(es, key) ?? en;
  return applyParams(value, params);
}

export function getSectionLabel(key: string, locale: Locale): string {
  if (locale === 'es') {
    if (key === 'COVER') return tr(locale, 'tracker.cover', 'Cover');
    if (key === 'TRN') return tr(locale, 'tracker.tournament', 'Tournament');
    if (key === 'HOST') return tr(locale, 'tracker.hostNations', 'Host Nations');
  } else {
    if (key === 'COVER') return 'Cover';
    if (key === 'TRN') return 'Tournament';
    if (key === 'HOST') return 'Host Nations';
  }
  return COUNTRY_BY_CODE[key]?.name ?? SECTION_LABELS[key] ?? key;
}
