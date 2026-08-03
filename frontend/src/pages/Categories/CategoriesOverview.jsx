import React from 'react';
import './CategoriesOverview.css';
import { categories } from '../../data/mockData';
import Button from '../../components/Button/Button';
import CategoryIcon from '../../components/CategoryIcon/CategoryIcon';
import { useI18n } from '../../i18n/I18nContext';

const CategoriesOverview = ({ onNavigate }) => {
  const { t } = useI18n();
  return (
    <div className="categories-overview-page">
      <div className="categories-overview__breadcrumb">
        <button className="breadcrumb-link" onClick={() => onNavigate('dashboard')}>
          {t('nav.home')}
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{t('nav.categories')}</span>
      </div>

      <div className="categories-overview__header">
        <div>
          <h1>{t('categories.overviewTitle')}</h1>
          <p>{t('categories.overviewDesc')}</p>
        </div>
        <Button variant="secondary" onClick={() => onNavigate('all-stores')}>
          {t('categories.viewAllStores')}
        </Button>
      </div>

      <div className="categories-overview__grid">
        {categories.map((category) => (
          <button
            key={category.id}
            className="category-overview-card"
            onClick={() => onNavigate('category-page', { categoryName: category.name })}
          >
            <span className="category-overview-card__img">
              <img src={category.image} alt={t('category.' + category.id)} loading="lazy" />
            </span>
            <span className="category-overview-card__icon">
              <CategoryIcon category={category.name} size={26} />
            </span>
            <h3>{t('category.' + category.id)}</h3>
            <p>{t('categories.pagesAvailable', { count: category.count })}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoriesOverview;
