import React, { useEffect, useState } from 'react';
import '../Auth/AuthPage.css';
import './AdminLogin.css';
import Button from '../../components/Button/Button';
import { loginAsAdmin, isAdminUser } from '../../firebase/firebaseService';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { useI18n } from '../../i18n/I18nContext';
import { ShieldCheck } from 'lucide-react';

const AdminLogin = ({ currentUser, onNavigate }) => {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      isAdminUser(currentUser.uid).then((isAdmin) => {
        if (isAdmin) {
          onNavigate('admin-dashboard');
        }
      });
    }
  }, [currentUser, onNavigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage(t('auth.missingFields'));
      return;
    }

    setLoading(true);

    try {
      await loginAsAdmin(email, password);
      onNavigate('admin-dashboard');
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <div className="admin-login-header">
          <span className="admin-login-icon">
            <ShieldCheck size={26} />
          </span>
        </div>
        <h2>{t('adminlogin.title')}</h2>
        <p className="auth-description">
          {t('adminlogin.desc')}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            {t('adminlogin.emailField')}
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@tijara.dz"
              required
            />
          </label>

          <label>
            {t('auth.passwordField')}
            <input
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              required
            />
          </label>

          {errorMessage && <p className="auth-error">{errorMessage}</p>}

          <div className="auth-actions">
            <Button type="button" variant="secondary" onClick={() => onNavigate('dashboard')}>
              {t('adminlogin.backToSite')}
            </Button>
            <Button type="submit" variant="glow" disabled={loading}>
              {loading ? t('adminlogin.verifying') : t('adminlogin.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
