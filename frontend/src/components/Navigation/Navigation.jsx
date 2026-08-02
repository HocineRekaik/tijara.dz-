import React from 'react';
import './Navigation.css';
import Button from '../Button/Button';
import { useI18n } from '../../i18n/I18nContext';
import {
  X,
  Home,
  LayoutGrid,
  Store,
  Sparkles,
  UserPlus,
  ShieldCheck,
  UserRound,
  LogOut,
  LogIn,
  Settings,
} from 'lucide-react';

const Navigation = ({ isOpen, onClose, onNavigate, currentUser, onLogout }) => {
  const { t } = useI18n();
  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose}></div>}

      <aside className={`tijara-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">{t('nav.menu')}</span>
          <button className="sidebar-close-btn" onClick={onClose} aria-label={t('common.close')}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <button type="button" className="sidebar-link" onClick={() => { onClose(); onNavigate('dashboard'); }}>
            <Home size={18} />
            {t('nav.home')}
          </button>
          <button type="button" className="sidebar-link" onClick={() => { onClose(); onNavigate('categories'); }}>
            <LayoutGrid size={18} />
            {t('nav.categories')}
          </button>
          <button type="button" className="sidebar-link" onClick={() => { onClose(); onNavigate('all-stores'); }}>
            <Store size={18} />
            {t('nav.stores')}
          </button>
          <button type="button" className="sidebar-link sidebar-link--ai" onClick={() => { onClose(); onNavigate('ai'); }}>
            <Sparkles size={18} />
            {t('nav.ai')}
          </button>
          <button type="button" className="sidebar-link" onClick={() => { onClose(); onNavigate('add-page'); }}>
            <UserPlus size={18} />
            {t('nav.addPage')}
          </button>
          <button type="button" className="sidebar-link" onClick={() => { onClose(); onNavigate('admin-dashboard'); }}>
            <ShieldCheck size={18} />
            {t('nav.admin')}
          </button>
          <button type="button" className="sidebar-link" onClick={() => { onClose(); onNavigate('settings'); }}>
            <Settings size={18} />
            {t('common.settings')}
          </button>
          {currentUser ? (
            <>
              <button type="button" className="sidebar-link" onClick={() => { onClose(); onNavigate('seller-profile'); }}>
                <UserRound size={18} />
                {t('nav.account')}
              </button>
              <button type="button" className="sidebar-link" onClick={() => { onClose(); onLogout(); }}>
                <LogOut size={18} />
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <button type="button" className="sidebar-link" onClick={() => { onClose(); onNavigate('auth'); }}>
              <LogIn size={18} />
              {t('nav.login')}
            </button>
          )}
        </nav>

        <div className="sidebar-actions">
          <Button variant="glow" onClick={() => { onClose(); onNavigate('ai'); }} icon={<Sparkles size={17} />} className="w-full">
            {t('nav.askAI')}
          </Button>
        </div>
      </aside>
    </>
  );
};

export default Navigation;
