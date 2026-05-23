import { defineMiddleware } from 'astro:middleware';
import { detectLocale, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from './i18n';

export const onRequest = defineMiddleware(async (context, next) => {
  if (!context.cookies.get(LOCALE_COOKIE)) {
    const country = context.request.headers.get('x-vercel-ip-country');
    const acceptLanguage = context.request.headers.get('accept-language');
    const locale = detectLocale(country, acceptLanguage);
    context.cookies.set(LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
  }
  return next();
});
