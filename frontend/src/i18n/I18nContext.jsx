import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from './translations';

const LANG_KEY = 'tijara_lang';
const DEFAULT_LANG = 'ar';

const I18nContext = createContext(null);

const getInitialLang = () => {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && translations[saved]) {
      return saved;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_LANG;
};

export const I18nProvider = ({ children }) => {
  const [lang, setLangState] = useState(getInitialLang);

  const setLang = (next) => {
    if (!translations[next]) {
      return;
    }
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const value = useMemo(() => {
    const dict = translations[lang] || translations[DEFAULT_LANG];
    return {
      lang,
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      setLang,
      t: (key, vars) => {
        let str = dict[key] ?? translations[DEFAULT_LANG][key] ?? key;
        if (vars) {
          Object.entries(vars).forEach(([k, v]) => {
            str = str.replaceAll(`{${k}}`, String(v));
          });
        }
        return str;
      },
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
};
