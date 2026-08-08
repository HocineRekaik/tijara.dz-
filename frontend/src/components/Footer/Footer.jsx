import React from 'react';
import './Footer.css';
import { useI18n } from '../../i18n/I18nContext';
import { Globe, Mail, Briefcase } from 'lucide-react';

const Footer = () => {
  const { t } = useI18n();
  return (
    <footer className="tijara-footer">
      <div className="footer-container">
        
        {/* Brand Column */}
        <div className="footer-column brand-column">
          <div className="footer-brand-logo">
            <div className="logo-badge">T</div>
            <span className="logo-text">Tijara<span className="logo-dot">.dz</span></span>
          </div>
          <p className="footer-desc">
            {t('footer.desc')}
          </p>
          <div className="footer-socials">
            <a href="https://www.facebook.com/share/198FmsAAAf/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Globe size={16} /> {t('footer.facebook')}</a>
            <a href="mailto:h_rekaik@estin.dz" aria-label="Email"><Mail size={16} /> {t('footer.email')}</a>
            <a href="https://www.linkedin.com/in/hocine-rekaik-a76a88425" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><Briefcase size={16} /> {t('footer.linkedin')}</a>
          </div>
        </div>

        {/* Links Column 1 */}
        <div className="footer-column">
          <h4 className="footer-title">{t('footer.browse')}</h4>
          <ul className="footer-links">
            <li><a href="#hero">{t('nav.home')}</a></li>
            <li><a href="#categories">{t('nav.categories')}</a></li>
            <li><a href="#featured">{t('footer.featuredStores')}</a></li>
            <li><a href="#latest">{t('footer.latestStores')}</a></li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div className="footer-column">
          <h4 className="footer-title">{t('footer.support')}</h4>
          <ul className="footer-links">
            <li><a href="#support">{t('footer.faq')}</a></li>
            <li><a href="#privacy">{t('footer.privacy')}</a></li>
            <li><a href="#terms">{t('footer.terms')}</a></li>
            <li><a href="#contact">{t('footer.contact')}</a></li>
          </ul>
        </div>

        {/* Newsletter / Contact info Column */}
        <div className="footer-column contact-column">
          <h4 className="footer-title">{t('footer.newsletter')}</h4>
          <p className="footer-desc">{t('footer.newsletterDesc')}</p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder={t('footer.email')} className="newsletter-input" />
            <button type="submit" className="newsletter-submit-btn">{t('footer.subscribe')}</button>
          </form>
        </div>

      </div>
      <div className="footer-bottom">
        <p>{t('footer.rights', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
};

export default Footer;
