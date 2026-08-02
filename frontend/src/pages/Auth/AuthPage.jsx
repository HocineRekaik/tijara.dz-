import React, { useState } from 'react';
import './AuthPage.css';
import Button from '../../components/Button/Button';
import {
  loginWithEmailAndPassword,
  registerWithEmailAndPassword,
  saveUserProfile,
} from '../../firebase/firebaseService';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { useI18n } from '../../i18n/I18nContext';

const AuthPage = ({ currentUser, onNavigate, pageParams }) => {
  const { t } = useI18n();
  const [mode, setMode] = useState('login');
  const [formValues, setFormValues] = useState({ email: '', password: '', confirmPassword: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectPage = pageParams?.redirect || 'dashboard';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const switchMode = (nextMode) => {
    setErrorMessage('');
    setFormValues({ email: '', password: '', confirmPassword: '' });
    setMode(nextMode);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!formValues.email || !formValues.password) {
      setErrorMessage(t('auth.missingFields'));
      return;
    }

    if (mode === 'register' && formValues.password !== formValues.confirmPassword) {
      setErrorMessage(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        const userCredential = await registerWithEmailAndPassword(formValues.email, formValues.password);
        await saveUserProfile(userCredential.user.uid, {
          email: userCredential.user.email,
          role: 'seller',
        });
        onNavigate('seller-profile');
      } else {
        await loginWithEmailAndPassword(formValues.email, formValues.password);
        onNavigate(redirectPage);
      }
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t));
    } finally {
      setLoading(false);
    }
  };

  if (currentUser) {
    return (
      <div className="auth-page">
        <div className="auth-page__card">
          <h2>{t('auth.alreadyLoggedIn')}</h2>
          <p>{t('auth.alreadyLoggedInDesc')}</p>
          <div className="auth-actions">
            <Button variant="secondary" onClick={() => onNavigate('dashboard')}>
              {t('common.backHome')}
            </Button>
            <Button variant="glow" onClick={() => onNavigate('seller-profile')}>
              {t('auth.sellerProfile')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <div className="auth-switcher">
          <button
            type="button"
            className={`auth-mode-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            {t('auth.tabLogin')}
          </button>
          <button
            type="button"
            className={`auth-mode-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            {t('auth.tabRegister')}
          </button>
        </div>

        <h2>{mode === 'register' ? t('auth.titleRegister') : t('auth.titleLogin')}</h2>
        <p className="auth-description">
          {mode === 'register' ? t('auth.descRegister') : t('auth.descLogin')}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            {t('auth.emailField')}
            <input
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleChange}
              placeholder="example@mail.dz"
              required
            />
          </label>

          <label>
            {t('auth.passwordField')}
            <input
              name="password"
              type="password"
              value={formValues.password}
              onChange={handleChange}
              placeholder="********"
              required
            />
          </label>

          {mode === 'register' && (
            <label>
              {t('auth.confirmPasswordField')}
              <input
                name="confirmPassword"
                type="password"
                value={formValues.confirmPassword}
                onChange={handleChange}
                placeholder="********"
                required
              />
            </label>
          )}

          {errorMessage && <p className="auth-error">{errorMessage}</p>}

          <div className="auth-actions">
            <Button type="submit" variant="glow" disabled={loading}>
              {loading ? t('auth.processing') : mode === 'register' ? t('auth.tabRegister') : t('auth.tabLogin')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
