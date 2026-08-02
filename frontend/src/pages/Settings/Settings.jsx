import React from 'react';
import './Settings.css';
import { useI18n } from '../../i18n/I18nContext';
import { useTheme } from '../../theme/ThemeContext';
import { Languages, Moon, Sun, Check } from 'lucide-react';

const LANGS = [
  { code: 'ar', label: 'العربية', hint: 'RTL' },
  { code: 'fr', label: 'Français', hint: 'LTR' },
  { code: 'en', label: 'English', hint: 'LTR' },
];

const Settings = () => {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <h1 className="settings-page__title">{t('settings.title')}</h1>
      </div>

      <section className="settings-card">
        <div className="settings-card__head">
          <span className="settings-card__icon">
            <Languages size={20} />
          </span>
          <div>
            <h2>{t('settings.languageSection')}</h2>
            <p>{t('settings.languageDesc')}</p>
          </div>
        </div>
        <div className="settings-options" role="radiogroup" aria-label={t('settings.languageSection')}>
          {LANGS.map((item) => (
            <button
              key={item.code}
              type="button"
              role="radio"
              aria-checked={lang === item.code}
              className={`settings-option ${lang === item.code ? 'active' : ''}`}
              onClick={() => setLang(item.code)}
            >
              <span className="settings-option__name">{item.label}</span>
              <span className="settings-option__hint">{item.hint}</span>
              {lang === item.code && (
                <span className="settings-option__check">
                  <Check size={16} />
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-card__head">
          <span className="settings-card__icon">
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </span>
          <div>
            <h2>{t('settings.themeSection')}</h2>
            <p>{t('settings.themeDesc')}</p>
          </div>
        </div>
        <div className="settings-options" role="radiogroup" aria-label={t('settings.themeSection')}>
          <button
            type="button"
            role="radio"
            aria-checked={theme === 'light'}
            className={`settings-option ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <span className="settings-option__name">{t('settings.light')}</span>
            {theme === 'light' && (
              <span className="settings-option__check">
                <Check size={16} />
              </span>
            )}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={theme === 'dark'}
            className={`settings-option ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <span className="settings-option__name">{t('settings.dark')}</span>
            {theme === 'dark' && (
              <span className="settings-option__check">
                <Check size={16} />
              </span>
            )}
          </button>
        </div>
      </section>
    </div>
  );
};

export default Settings;
