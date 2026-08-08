import React from 'react';
import './StoreCard.css';
import { Store, MapPin } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { getStoreMainImage } from '../../utils/storeImages';

const StoreCard = ({ store, onViewStore }) => {
  const { t } = useI18n();
  const { title, description, category, wilaya, rating = 4.5, reviewCount = 0, badge, isFeatured } = store;
  const mainImage = getStoreMainImage(store);

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    const stars = [];
    for (let i = 0; i < full; i++) stars.push('★');
    if (hasHalf) stars.push('½');
    return stars.join('');
  };

  return (
    <div className={`store-card ${isFeatured ? 'store-card--featured' : ''}`}>
      {badge && <span className="store-card__badge">{badge}</span>}

      {/* Image / Logo placeholder */}
      <div className="store-card__image">
        {mainImage ? (
          <img src={mainImage} alt={title} className="store-card__img" />
        ) : (
          <div className="store-card__image-placeholder">
            <span className="store-card__image-emoji">
              <Store size={32} />
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="store-card__body">
        {category && <span className="store-card__category-chip">{category}</span>}

        <h3 className="store-card__title">{title}</h3>

        <div className="store-card__meta">
          <span className="store-card__wilaya">
            <span className="meta-icon">
              <MapPin size={15} />
            </span>
            {wilaya}
          </span>
          <div className="store-card__rating-row">
            <span className="store-card__stars">{renderStars(rating)}</span>
            <span className="store-card__rating-value">{rating}</span>
            <span className="store-card__review-count">({reviewCount} {t('storecard.reviews')})</span>
          </div>
        </div>

        <p className="store-card__desc">{description}</p>

        <button
          className="store-card__cta"
          onClick={(e) => {
            e.stopPropagation();
            onViewStore(store);
          }}
        >
          {t('common.showPage')}
        </button>      </div>
    </div>
  );
};

export default StoreCard;
