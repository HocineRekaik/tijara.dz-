import React from 'react';
import './Card.css';
import { Store, Star, MapPin, Phone } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

const Card = ({
  title,
  description,
  category,
  image,
  badge,
  location,
  phone,
  rating,
  tags = [],
  isFeatured = false,
  onClick
}) => {
  const { t } = useI18n();
  return (
    <div className={`tijara-card ${isFeatured ? 'featured' : ''}`} onClick={onClick}>
      {badge && <span className="card-badge">{badge}</span>}
      <div className="card-image-container">
        {image ? (
          <img src={image} alt={title} className="card-image" />
        ) : (
          <div className="card-image-placeholder">
            <span className="placeholder-icon">
              <Store size={32} />
            </span>
          </div>
        )}
        <span className="card-category">{category}</span>
      </div>
      <div className="card-content">
        <div className="card-header-row">
          <h3 className="card-title">{title}</h3>
          {rating ? (
            <div className="card-rating">
              <span className="star-icon">
                <Star size={14} fill="currentColor" />
              </span>
              <span className="rating-val">{rating}</span>
            </div>
          ) : null}
        </div>
        <p className="card-description">{description}</p>

        {tags.length > 0 && (
          <div className="card-tags">
            {tags.map((tag, idx) => (
              <span key={idx} className="card-tag">#{tag}</span>
            ))}
          </div>
        )}

        <div className="card-meta">
          {location && (
            <span className="card-meta-item">
              <span className="meta-icon">
                <MapPin size={15} />
              </span>
              {location}
            </span>
          )}
          {phone && (
            <span className="card-meta-item">
              <span className="meta-icon">
                <Phone size={15} />
              </span>
              {phone}
            </span>
          )}
        </div>
        <button className="card-action-btn">{t('common.viewPage')}</button>
      </div>
    </div>
  );
};

export default Card;
