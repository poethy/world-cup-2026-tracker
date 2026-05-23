import type { Locale } from './types';

export const LOCALE_COOKIE = 'locale';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** ISO 3166-1 alpha-2 countries where Spanish is the predominant/official language */
export const SPANISH_SPEAKING_COUNTRIES = new Set([
  'ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU',
  'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'GQ',
  'PR',
]);

export const DEFAULT_LOCALE: Locale = 'en';
