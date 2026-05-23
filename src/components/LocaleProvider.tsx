import React, { createContext, useContext, useMemo } from 'react';
import { getSectionLabel as getSectionLabelFn, tr, type Locale } from '../i18n';

interface LocaleContextValue {
  locale: Locale;
  tr: (key: Parameters<typeof tr>[1], en: string, params?: Record<string, string | number>) => string;
  getSectionLabel: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  locale: Locale;
  children: React.ReactNode;
}

export function LocaleProvider({ locale, children }: LocaleProviderProps) {
  const value = useMemo(() => ({
    locale,
    tr: (key, en, params) => tr(locale, key, en, params),
    getSectionLabel: (key: string) => getSectionLabelFn(key, locale),
  }), [locale]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useI18n(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useI18n must be used within LocaleProvider');
  }
  return ctx;
}
