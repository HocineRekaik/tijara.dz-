import React from 'react';
import './Header.css';
import Button from '../Button/Button';
import { useI18n } from '../../i18n/I18nContext';
import {
  Menu,
  Home,
  LayoutGrid,
  Store,
  Sparkles,
  LogIn,
  LogOut,
  UserRound,
  UserPlus,
  ShieldCheck,
  Settings,
} from 'lucide-react';

const Header = ({ onMenuToggle, onNavigate, activePage, currentUser, onLogout }) => {
  const { t } = useI18n();
  return (
    <header className="tijara-header">
      <div className="header-container">
        <button className="menu-toggle-btn" onClick={onMenuToggle} aria-label={t('nav.menu')}>
          <Menu size={24} />
        </button>

        <nav className="desktop-nav">
          <button
            type="button"
            className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            <Home size={17} />
            {t('nav.home')}
          </button>
          <button
            type="button"
            className={`nav-link ${activePage === 'categories' ? 'active' : ''}`}
            onClick={() => onNavigate('categories')}
          >
            <LayoutGrid size={17} />
            {t('nav.categories')}
          </button>
          <button
            type="button"
            className={`nav-link ${activePage === 'all-stores' ? 'active' : ''}`}
            onClick={() => onNavigate('all-stores')}
          >
            <Store size={17} />
            {t('nav.stores')}
          </button>
          <button
            type="button"
            className={`nav-link nav-link--ai ${activePage === 'ai' ? 'active' : ''}`}
            onClick={() => onNavigate('ai')}
          >
            <Sparkles size={16} />
            {t('nav.ai')}
          </button>
        </nav>

        <div className="header-actions">
          <button type="button" className="header-text-btn" onClick={() => onNavigate('settings')} aria-label={t('common.settings')}>
            <Settings size={16} />
          </button>
          <button type="button" className="header-text-btn" onClick={() => onNavigate('admin-dashboard')}>
            <ShieldCheck size={16} />
            {t('nav.admin')}
          </button>

          {currentUser ? (
            <button type="button" className="header-text-btn" onClick={() => onNavigate('seller-profile')}>
              <UserRound size={16} />
              {t('nav.account')}
            </button>
          ) : (
            <button type="button" className="header-text-btn" onClick={() => onNavigate('auth')}>
              <LogIn size={16} />
              {t('nav.login')}
            </button>
          )}

          {currentUser && (
            <button type="button" className="header-text-btn header-text-btn--danger" onClick={onLogout}>
              <LogOut size={16} />
              {t('nav.logout')}
            </button>
          )}

          <Button variant="primary" onClick={() => onNavigate('add-page')} icon={<UserPlus size={17} />}>
            {t('nav.addPage')}
          </Button>
        </div>

        <div className="header-brand" onClick={() => onNavigate('dashboard')} role="button" aria-label={`Tijara.dz - ${t('nav.home')}`}>
          <div className="header-logo-badge">T</div>
          <span className="header-logo-text">
            Tijara<span className="logo-dot">.dz</span>
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
